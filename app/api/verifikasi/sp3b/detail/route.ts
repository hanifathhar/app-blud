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
  const no_sp3b = searchParams.get("no_sp3b");
  const kd_upt = searchParams.get("kd_upt");

  if (!no_sp3b || !kd_upt) {
    return NextResponse.json({ error: "Parameter no_sp3b dan kd_upt diperlukan" }, { status: 400 });
  }

  try {
    const headerRows: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "trhsp3b" WHERE "no_sp3b" = $1 AND "kd_upt" = $2 LIMIT 1`,
      no_sp3b,
      kd_upt
    );

    if (!headerRows || headerRows.length === 0) {
      return NextResponse.json({ error: "Dokumen SP3B tidak ditemukan" }, { status: 404 });
    }

    const sp3b = headerRows[0];

    // Ambil UPT info
    const upt = await prisma.msUpt.findFirst({
      where: { kd_upt },
    });

    // Ambil rincian pendapatan SP3B
    const rincianPendapatan: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "trdsp3b_pendapatan" WHERE "no_sp3b" = $1 AND "kd_upt" = $2 ORDER BY "kd_rek6" ASC`,
      no_sp3b,
      kd_upt
    );

    // Ambil rincian belanja SP3B
    const rincianBelanja: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "trdsp3b_belanja" WHERE "no_sp3b" = $1 AND "kd_upt" = $2 ORDER BY "kd_sub_kegiatan" ASC, "kd_rek6" ASC`,
      no_sp3b,
      kd_upt
    );

    return NextResponse.json({
      success: true,
      data: {
        ...sp3b,
        nm_upt: upt?.nm_upt || sp3b.nm_upt || kd_upt,
        total_pendapatan: Number(sp3b.total_pendapatan) || 0,
        total_belanja: Number(sp3b.total_belanja) || 0,
        rincianPendapatan: rincianPendapatan.map((p) => ({
          ...p,
          nilai: Number(p.nilai) || 0,
        })),
        rincianBelanja: rincianBelanja.map((b) => ({
          ...b,
          nilai: Number(b.nilai) || 0,
        })),
        upt,
      },
    });
  } catch (error: any) {
    console.error("GET SP3B Detail Error:", error);
    return NextResponse.json({ error: error.message || "Gagal memuat detail SP3B" }, { status: 500 });
  }
}
