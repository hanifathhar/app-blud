export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const tahun = searchParams.get("tahun") ? parseInt(searchParams.get("tahun")!) : new Date().getFullYear();
  const kd_upt = searchParams.get("kd_upt") || user.kd_upt;

  const where: Record<string, unknown> = { tahun };
  if (user.role !== "superadmin") where.kd_upt = user.kd_upt;
  else if (kd_upt) where.kd_upt = kd_upt;

  // Ambil realisasi per bulan
  const realisasi = await prisma.realisasiAnggaran.findMany({
    where,
    orderBy: [{ bulan: "asc" }],
  });

  // Ambil TblRbaPenetapan yang aktif untuk total pagu
  const rbaWhere: Record<string, unknown> = { is_aktif: true, tahun: tahun.toString() };
  if (user.role !== "superadmin") rbaWhere.kdUnit = user.kd_upt;
  else if (kd_upt) rbaWhere.kdUnit = kd_upt;

  // Ambil TblRbaPenetapan yang aktif untuk pagu Pendapatan
  const rbaPendapatan = await prisma.tblRbaPenetapan.aggregate({
    where: { ...rbaWhere, nmSubKegiatan: { equals: "PENDAPATAN", mode: "insensitive" } },
    _sum: { nilai: true },
  });

  // Ambil TblRbaPenetapan yang aktif untuk pagu Belanja
  const rbaBelanja = await prisma.tblRbaPenetapan.aggregate({
    where: { ...rbaWhere, NOT: { nmSubKegiatan: { equals: "PENDAPATAN", mode: "insensitive" } } },
    _sum: { nilai: true },
  });

  const totalPendapatan = Number(rbaPendapatan._sum.nilai || 0);
  const totalBelanja = Number(rbaBelanja._sum.nilai || 0);
  const totalPagu = totalBelanja;
  const totalRealisasi = realisasi.reduce((s, r) => s + (r.realisasi || 0), 0);

  // Rekap per bulan (1-12)
  const perBulan: Record<number, number> = {};
  for (let i = 1; i <= 12; i++) perBulan[i] = 0;
  realisasi.forEach((r) => {
    perBulan[r.bulan] = (perBulan[r.bulan] || 0) + (r.realisasi || 0);
  });

  const chartData = Object.entries(perBulan).map(([bulan, nilai]) => ({
    bulan: parseInt(bulan),
    realisasi: nilai,
    pagu: totalPagu / 12,
  }));

  return NextResponse.json({
    data: realisasi,
    summary: {
      totalPagu,
      totalPendapatan,
      totalBelanja,
      totalRealisasi,
      persentase: totalPagu > 0 ? ((totalRealisasi / totalPagu) * 100).toFixed(2) : "0",
      sisa: totalPagu - totalRealisasi,
    },
    chartData,
  });
}
