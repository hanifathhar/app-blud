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

    const tagihan = await prisma.tagihan.findUnique({
      where: { id },
      include: {
        rincian: true,
        penerimaan_barang: {
          include: {
            pengadaan: {
              include: {
                rincian: true
              }
            }
          }
        },
        permintaan_belanja: {
          include: {
            rincian: true
          }
        },
        bku: {
          orderBy: { id: "desc" }
        },
        pengeluaran: true
      }
    });

    if (!tagihan) {
      return NextResponse.json({ error: "Data tagihan tidak ditemukan" }, { status: 404 });
    }

    // Security check
    if (auth.role !== "superadmin" && auth.kd_upt && tagihan.kd_upt && auth.kd_upt !== tagihan.kd_upt) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    // Fetch UPT info
    let upt = null;
    if (tagihan.kd_upt) {
      upt = await prisma.msUpt.findFirst({
        where: { kd_upt: tagihan.kd_upt }
      });
    }

    // Fetch Penandatangan:
    // kode: 1=KPA, 2=PPTK, 5=Bendahara Pengeluaran
    let penandatanganKpa = null;
    let penandatanganPptk = null;
    let penandatanganBendahara = null;

    if (tagihan.kd_upt) {
      penandatanganKpa = await prisma.penandatangan.findFirst({
        where: {
          kd_upt: tagihan.kd_upt,
          kode: 1,
          status: 1
        },
        orderBy: { id: "desc" }
      });

      penandatanganPptk = await prisma.penandatangan.findFirst({
        where: {
          kd_upt: tagihan.kd_upt,
          kode: 2,
          status: 1
        },
        orderBy: { id: "desc" }
      });

      penandatanganBendahara = await prisma.penandatangan.findFirst({
        where: {
          kd_upt: tagihan.kd_upt,
          kode: 5, // Bendahara Pengeluaran
          status: 1
        },
        orderBy: { id: "desc" }
      });
    }

    return NextResponse.json({
      success: true,
      data: tagihan,
      upt,
      penandatanganKpa,
      penandatanganPptk,
      penandatanganBendahara
    });
  } catch (error: any) {
    console.error("Cetak Kwitansi API Error:", error);
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server" }, { status: 500 });
  }
}
