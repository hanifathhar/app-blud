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

    const pengadaan = await prisma.pengadaan.findUnique({
      where: { id },
      include: {
        rincian: {
          orderBy: { id: "asc" }
        },
        permintaan_belanja: true
      }
    });

    if (!pengadaan) {
      return NextResponse.json({ error: "Data pengadaan tidak ditemukan" }, { status: 404 });
    }

    // Security check
    if (auth.role !== "superadmin" && auth.kd_upt && pengadaan.kd_upt && auth.kd_upt !== pengadaan.kd_upt) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    // Fetch UPT info
    let upt = null;
    if (pengadaan.kd_upt) {
      upt = await prisma.msUpt.findFirst({
        where: { kd_upt: pengadaan.kd_upt }
      });
    }

    // Fetch Penandatangan PPTK (kode: 2)
    let penandatanganPptk = null;
    if (pengadaan.kd_upt) {
      penandatanganPptk = await prisma.penandatangan.findFirst({
        where: {
          kd_upt: pengadaan.kd_upt,
          kode: 2, // PPTK
          status: 1
        },
        orderBy: { id: "desc" }
      });
    }

    return NextResponse.json({
      success: true,
      data: pengadaan,
      upt,
      penandatanganPptk
    });
  } catch (error: any) {
    console.error("Cetak Pengadaan API Error:", error);
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server" }, { status: 500 });
  }
}
