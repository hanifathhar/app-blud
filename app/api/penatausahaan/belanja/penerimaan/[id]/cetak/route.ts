import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

    const penerimaan = await prisma.penerimaanBarang.findUnique({
      where: { id },
      include: {
        pengadaan: {
          include: {
            rincian: {
              orderBy: { id: "asc" },
            },
            permintaan_belanja: true,
          },
        },
      },
    });

    if (!penerimaan) {
      return NextResponse.json({ error: "Data penerimaan BAST tidak ditemukan" }, { status: 404 });
    }

    const kdUpt = penerimaan.kd_upt || penerimaan.pengadaan?.kd_upt;

    // Security check
    if (auth.role !== "superadmin" && auth.kd_upt && kdUpt && auth.kd_upt !== kdUpt) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    // Fetch UPT info
    let upt = null;
    if (kdUpt) {
      upt = await prisma.msUpt.findFirst({
        where: { kd_upt: kdUpt },
      });
    }

    // Fetch Sub Kegiatan jika ada
    let subGiat = null;
    const kdSubGiat = penerimaan.pengadaan?.kd_sub_kegiatan;
    if (kdSubGiat) {
      subGiat = await prisma.mSubGiat.findFirst({
        where: { kd_sub_kegiatan: kdSubGiat },
      });
    }

    // Fetch Penandatangan:
    // 1. KPA / Kepala Dinas (kode: 1)
    // 2. Pengurus Barang Pengguna (kode: 6, fallback ke PPTK kode: 2)
    let penandatanganKpa = null;
    let penandatanganPengurusBarang = null;

    if (kdUpt) {
      penandatanganKpa = await prisma.penandatangan.findFirst({
        where: {
          kd_upt: kdUpt,
          kode: 1, // KPA / Kepala Dinas
          status: 1,
        },
        orderBy: { id: "desc" },
      });

      // Cari khusus Pengurus Barang (kode: 6)
      penandatanganPengurusBarang = await prisma.penandatangan.findFirst({
        where: {
          kd_upt: kdUpt,
          kode: 6, // Pengurus Barang Pengguna
          status: 1,
        },
        orderBy: { id: "desc" },
      });

      // Fallback jika belum di-set kode 6, gunakan PPTK (kode: 2)
      if (!penandatanganPengurusBarang) {
        penandatanganPengurusBarang = await prisma.penandatangan.findFirst({
          where: {
            kd_upt: kdUpt,
            kode: 2, // PPTK
            status: 1,
          },
          orderBy: { id: "desc" },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: penerimaan,
      upt,
      subGiat,
      penandatanganKpa,
      penandatanganPengurusBarang,
    });
  } catch (error: any) {
    console.error("Cetak BAST API Error:", error);
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server" }, { status: 500 });
  }
}
