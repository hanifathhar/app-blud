export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isSuperAdmin = user.role === "superadmin" || user.level === 1;
    const { searchParams } = new URL(req.url);
    const kd_upt = isSuperAdmin
      ? (searchParams.get("kd_upt") || user.kd_upt || user.unit || "")
      : (user.kd_upt || user.unit || "");
    const tahunParam = searchParams.get("tahun") || new Date().getFullYear().toString();

    // Helper filter boolean: Tidak mengandung Pendapatan dan Pembiayaan
    const isBelanjaSubGiat = (nm?: string | null, kd?: string | null) => {
      const text = `${nm || ""} ${kd || ""}`.toUpperCase();
      if (text.includes("PENDAPATAN")) return false;
      if (text.includes("PEMBIAYAAN")) return false;
      if (text.includes("SILPA") || text.includes("SISA LEBIH")) return false;
      return true;
    };

    // 1. Ambil list Sub Kegiatan unik KHUSUS BELANJA
    // Prioritas UTAMA: Hanya dokumen penetapan RBA yang aktif (is_aktif = true)
    let subKegiatanList: Array<{ kd_sub_kegiatan: string; nm_sub_kegiatan: string }> = [];

    // Cek apakah ada RBA Penetapan aktif untuk UPT & Tahun ini
    const aktifPenetapan = await prisma.tblRbaPenetapan.findMany({
      where: {
        tahun: tahunParam,
        is_aktif: true,
        ...(kd_upt ? { kdUnit: kd_upt } : {}),
      },
      select: {
        no_rba: true,
        nomor_penetapan: true,
      },
    });

    if (aktifPenetapan.length > 0) {
      // Ambil rincian penetapan RBA yang aktif
      const noRbaList = aktifPenetapan.map((p) => p.no_rba);
      const rbaPenetapanSubs = await prisma.tblRbaRincianPenetapan.findMany({
        where: {
          tahun: tahunParam,
          ...(kd_upt ? { kdUnit: kd_upt } : {}),
          no_rba: { in: noRbaList },
          kdSubKegiatan: { not: null },
          kd_rek6: { startsWith: "5" },
          NOT: {
            OR: [
              { kd_rek6: { startsWith: "4" } },
              { kd_rek6: { startsWith: "6" } },
              { nmSubKegiatan: { contains: "PENDAPATAN", mode: "insensitive" } },
              { nmSubKegiatan: { contains: "PEMBIAYAAN", mode: "insensitive" } },
              { nmSubKegiatan: { contains: "SILPA", mode: "insensitive" } },
            ],
          },
        },
        select: {
          kdSubKegiatan: true,
          nmSubKegiatan: true,
        },
        distinct: ["kdSubKegiatan"],
      });

      subKegiatanList = rbaPenetapanSubs
        .filter((s) => s.kdSubKegiatan && isBelanjaSubGiat(s.nmSubKegiatan, s.kdSubKegiatan))
        .map((s) => ({
          kd_sub_kegiatan: s.kdSubKegiatan!.trim(),
          nm_sub_kegiatan: s.nmSubKegiatan || s.kdSubKegiatan!,
        }));
    }

    // 2. Ambil list Rekening Belanja 5.x (Objek Belanja) dari dokumen penetapan RBA yang aktif
    const selectedSubGiat = searchParams.get("kd_sub_kegiatan");

    let rekeningList: Array<{ kd_rek6: string; nm_rek6: string }> = [];

    if (aktifPenetapan.length > 0) {
      const noRbaList = aktifPenetapan.map((p) => p.no_rba);
      const rbaRekFilter: any = {
        tahun: tahunParam,
        ...(kd_upt ? { kdUnit: kd_upt } : {}),
        ...(selectedSubGiat ? { kdSubKegiatan: selectedSubGiat } : {}),
        kd_rek6: { startsWith: "5" },
        no_rba: { in: noRbaList },
      };

      const rbaRekPenetapan = await prisma.tblRbaRincianPenetapan.findMany({
        where: rbaRekFilter,
        select: {
          kd_rek6: true,
          nm_rek6: true,
        },
        distinct: ["kd_rek6"],
      });

      rekeningList = rbaRekPenetapan
        .filter((r) => r.kd_rek6)
        .map((r) => ({
          kd_rek6: r.kd_rek6!.trim(),
          nm_rek6: r.nm_rek6 || r.kd_rek6!,
        }));
    }

    return NextResponse.json({
      success: true,
      subKegiatanList,
      rekeningList,
    });
  } catch (error: any) {
    console.error("Options BKU Rincian Objek Error:", error);
    return NextResponse.json({ error: error.message || "Gagal memuat options" }, { status: 500 });
  }
}
