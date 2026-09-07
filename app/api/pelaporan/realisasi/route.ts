export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const tahunParam = searchParams.get("tahun");
  const tahun = tahunParam ? parseInt(tahunParam) : new Date().getFullYear();
  const tahunStr = tahun.toString();
  const isSuperAdmin = user.role === "superadmin" || user.level === 1;
  const kd_upt = searchParams.get("kd_upt") || (!isSuperAdmin ? (user.kd_upt || user.unit) : "");

  // 1. Ambil Pagu Belanja Aktif dari TblRbaPenetapan
  const rbaWhere: Record<string, unknown> = {
    is_aktif: true,
    tahun: tahunStr,
    NOT: { nmSubKegiatan: { equals: "PENDAPATAN", mode: "insensitive" } },
  };
  if (!isSuperAdmin) {
    if (user.kd_upt || user.unit) rbaWhere.kdUnit = user.kd_upt || user.unit;
  } else if (kd_upt) {
    rbaWhere.kdUnit = kd_upt;
  }

  const rbaBelanja = await prisma.tblRbaPenetapan.aggregate({
    where: rbaWhere,
    _sum: { nilai: true },
  });
  const totalPagu = Number(rbaBelanja._sum.nilai || 0);

  // 2. Ambil Data Realisasi dari Tabel Pengeluaran (tbl_pengeluaran & tbl_rincian_pengeluaran)
  const startDate = new Date(tahun, 0, 1);
  const endDate = new Date(tahun + 1, 0, 1);

  const pengWhere: any = {
    OR: [
      { tahun: tahunStr },
      {
        tgl_pengeluaran: {
          gte: startDate,
          lt: endDate,
        },
      },
    ],
  };

  if (!isSuperAdmin) {
    if (user.kd_upt || user.unit) pengWhere.kd_upt = user.kd_upt || user.unit;
  } else if (kd_upt) {
    pengWhere.kd_upt = kd_upt;
  }

  const pengeluaranList = await prisma.pengeluaran.findMany({
    where: pengWhere,
    include: {
      rincian: true,
    },
    orderBy: [{ tgl_pengeluaran: "asc" }, { id: "asc" }],
  });

  // Rekap per bulan (1-12)
  const perBulan: Record<number, number> = {};
  for (let i = 1; i <= 12; i++) perBulan[i] = 0;

  pengeluaranList.forEach((peng) => {
    const tgl = peng.tgl_pengeluaran ? new Date(peng.tgl_pengeluaran) : null;
    let b = tgl ? tgl.getMonth() + 1 : 1;
    if (b < 1 || b > 12) b = 1;

    let nominal = 0;
    if (peng.rincian && peng.rincian.length > 0) {
      nominal = peng.rincian.reduce((acc, r) => acc + (Number(r.total) || 0), 0);
    } else {
      nominal = Number(peng.nilai_pengeluaran) || 0;
    }

    perBulan[b] = (perBulan[b] || 0) + nominal;
  });

  const totalRealisasi = Object.values(perBulan).reduce((s, v) => s + v, 0);

  const chartData = Object.entries(perBulan).map(([bulan, nilai]) => ({
    bulan: parseInt(bulan),
    realisasi: nilai,
    pagu: totalPagu / 12,
  }));

  // Rekap per Rekening Belanja
  const rekSummary: Record<string, { kd_rek6: string; nm_rek6: string; total: number; kd_sub_kegiatan: string; nm_sub_kegiatan: string }> = {};
  pengeluaranList.forEach((peng) => {
    if (peng.rincian && peng.rincian.length > 0) {
      peng.rincian.forEach((r) => {
        const key = r.kd_rek6 || "lainnya";
        if (!rekSummary[key]) {
          rekSummary[key] = {
            kd_rek6: r.kd_rek6 || "-",
            nm_rek6: r.nm_rek6 || "-",
            kd_sub_kegiatan: r.kd_sub_kegiatan || peng.kd_sub_kegiatan || "-",
            nm_sub_kegiatan: r.nm_sub_kegiatan || peng.nm_sub_kegiatan || "-",
            total: 0,
          };
        }
        rekSummary[key].total += Number(r.total) || 0;
      });
    } else if (peng.kd_rek6) {
      const key = peng.kd_rek6;
      if (!rekSummary[key]) {
        rekSummary[key] = {
          kd_rek6: peng.kd_rek6,
          nm_rek6: peng.nm_rek6 || "-",
          kd_sub_kegiatan: peng.kd_sub_kegiatan || "-",
          nm_sub_kegiatan: peng.nm_sub_kegiatan || "-",
          total: 0,
        };
      }
      rekSummary[key].total += Number(peng.nilai_pengeluaran) || 0;
    }
  });

  return NextResponse.json({
    summary: {
      totalPagu,
      totalRealisasi,
      persentase: totalPagu > 0 ? ((totalRealisasi / totalPagu) * 100).toFixed(2) : "0",
      sisa: totalPagu - totalRealisasi,
    },
    chartData,
    rekeningSummary: Object.values(rekSummary).sort((a, b) => b.total - a.total),
  });
}
