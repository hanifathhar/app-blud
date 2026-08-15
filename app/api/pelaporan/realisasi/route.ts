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

  // Ambil DPA yang sudah disetujui untuk total pagu
  const dpaWhere: Record<string, unknown> = { status: "disetujui" };
  const tahunData = await prisma.tahunAnggaran.findFirst({ where: { tahun } });
  if (tahunData) dpaWhere.tahun_id = tahunData.id;
  if (user.role !== "superadmin") dpaWhere.kd_upt = user.kd_upt;
  else if (kd_upt) dpaWhere.kd_upt = kd_upt;

  const dpas = await prisma.dPA.findMany({
    where: dpaWhere,
    select: { pagu: true, kd_program: true, kd_upt: true },
  });

  const totalPagu = dpas.reduce((s, d) => s + (d.pagu || 0), 0);
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
      totalRealisasi,
      persentase: totalPagu > 0 ? ((totalRealisasi / totalPagu) * 100).toFixed(2) : "0",
      sisa: totalPagu - totalRealisasi,
    },
    chartData,
  });
}
