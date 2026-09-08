export const runtime = "nodejs";

import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

export async function GET(req: Request) {
  const user = getUserFromRequest(req as NextRequest);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const kdUnit = searchParams.get("kdUnit") || "";
  const no_lpj = searchParams.get("no_lpj") || "";
  const id = searchParams.get("id");

  if (!id && (!kdUnit || !no_lpj)) {
    return NextResponse.json({ error: "Parameter id atau (kdUnit dan no_lpj) diperlukan" }, { status: 400 });
  }

  try {
    let lpj: any = null;
    if (id) {
      const rows: any[] = await prisma.$queryRawUnsafe(
        `SELECT * FROM "tbl_lpj" WHERE "id" = $1 LIMIT 1`,
        parseInt(id)
      );
      if (rows && rows.length > 0) lpj = rows[0];
    } else {
      const rows: any[] = await prisma.$queryRawUnsafe(
        `SELECT * FROM "tbl_lpj" WHERE "kd_upt" = $1 AND "no_lpj" = $2 LIMIT 1`,
        kdUnit,
        no_lpj
      );
      if (rows && rows.length > 0) lpj = rows[0];
    }

    if (!lpj) {
      return NextResponse.json({ error: "Dokumen pengesahan LPJ tidak ditemukan" }, { status: 404 });
    }

    // Ambil info UPT
    const upt = await prisma.msUpt.findFirst({
      where: { kd_upt: lpj.kd_upt },
    });

    // Ambil rincian LPJ
    const rincianRows: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "tbl_rincian_lpj" WHERE "lpj_id" = $1 ORDER BY "id" ASC`,
      lpj.id
    );

    // Filter Pendapatan & Belanja
    const rincianPendapatan = rincianRows
      .filter((r: any) => r.jenis === "pendapatan")
      .map((r: any) => ({
        id: r.id,
        kd_rek6: r.kd_rek6 || "-",
        nm_rek6: r.nm_rek6 || "-",
        sumdan: r.sumdan || lpj.sumdan || "-",
        jumlah: Number(r.jumlah) || 0,
        keterangan: r.keterangan || "",
      }));

    const rincianBelanja = rincianRows
      .filter((r: any) => r.jenis === "belanja")
      .map((r: any) => ({
        id: r.id,
        kd_sub_kegiatan: r.kd_sub_kegiatan || "",
        nm_sub_kegiatan: r.nm_sub_kegiatan || "",
        kd_rek6: r.kd_rek6 || "",
        nm_rek6: r.nm_rek6 || "-",
        sumdan: r.sumdan || lpj.sumdan || "-",
        full_kd_rek: r.kd_sub_kegiatan && r.kd_rek6 ? `${r.kd_sub_kegiatan}.${r.kd_rek6}` : (r.kd_rek6 || r.kd_sub_kegiatan || "-"),
        jumlah: Number(r.jumlah) || 0,
        keterangan: r.keterangan || "",
      }));

    return NextResponse.json({
      success: true,
      data: {
        ...lpj,
        nm_upt: upt?.nm_upt || lpj.nm_upt || lpj.kd_upt,
        total_pendapatan: Number(lpj.total_pendapatan) || 0,
        total_belanja: Number(lpj.total_belanja) || 0,
        rincianPendapatan,
        rincianBelanja,
        rincian: rincianRows,
        upt,
      },
    });
  } catch (error: any) {
    console.error("GET LPJ Detail Error:", error);
    return NextResponse.json({ error: error.message || "Gagal memuat detail LPJ" }, { status: 500 });
  }
}
