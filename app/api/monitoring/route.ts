export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== "superadmin")
    return NextResponse.json({ error: "Forbidden - Hanya Superadmin" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const tahun = searchParams.get("tahun")
    ? parseInt(searchParams.get("tahun")!)
    : new Date().getFullYear();

  // Ambil semua UPT aktif
  const upts = await prisma.msUpt.findMany({
    where: { status: 1 },
    orderBy: [{ type: "asc" }, { nm_upt: "asc" }],
  });

  const tahunData = await prisma.tahunAnggaran.findFirst({ where: { tahun } });

  // Untuk setiap UPT, hitung summary
  const uptStats = await Promise.all(
    upts.map(async (upt) => {
      const kd_upt = upt.kd_upt || "";

      // Pagu dari DPA yang disetujui
      const dpas = await prisma.dPA.aggregate({
        where: {
          kd_upt,
          status: "disetujui",
          ...(tahunData ? { tahun_id: tahunData.id } : {}),
        },
        _sum: { pagu: true },
        _count: { id: true },
      });

      // Realisasi tahun berjalan
      const realisasi = await prisma.realisasiAnggaran.aggregate({
        where: { kd_upt, tahun },
        _sum: { realisasi: true },
      });

      // SPP pending (diajukan/diverifikasi)
      const sppPending = await prisma.sPP.count({
        where: { kd_upt, status: { in: ["diajukan", "diverifikasi"] } },
      });

      const totalPagu = dpas._sum.pagu || 0;
      const totalRealisasi = realisasi._sum.realisasi || 0;
      const persentase = totalPagu > 0 ? (totalRealisasi / totalPagu) * 100 : 0;

      return {
        ...upt,
        totalPagu,
        totalRealisasi,
        persentase: parseFloat(persentase.toFixed(2)),
        sisa: totalPagu - totalRealisasi,
        jumlahDpa: dpas._count.id,
        sppPending,
        status_keuangan:
          persentase >= 80
            ? "baik"
            : persentase >= 50
            ? "sedang"
            : "rendah",
      };
    })
  );

  // Summary total semua UPT
  const totalPaguAll = uptStats.reduce((s, u) => s + u.totalPagu, 0);
  const totalRealisasiAll = uptStats.reduce((s, u) => s + u.totalRealisasi, 0);

  return NextResponse.json({
    data: uptStats,
    summary: {
      totalUpt: upts.length,
      totalPagu: totalPaguAll,
      totalRealisasi: totalRealisasiAll,
      persentase:
        totalPaguAll > 0
          ? ((totalRealisasiAll / totalPaguAll) * 100).toFixed(2)
          : "0",
      uptBaik: uptStats.filter((u) => u.status_keuangan === "baik").length,
      uptSedang: uptStats.filter((u) => u.status_keuangan === "sedang").length,
      uptRendah: uptStats.filter((u) => u.status_keuangan === "rendah").length,
    },
  });
}
