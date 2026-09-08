export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const bulanParam = searchParams.get("bulan");
  const tahunParam = searchParams.get("tahun");
  const now = new Date();
  const bulan = bulanParam ? parseInt(bulanParam) : now.getMonth() + 1;
  const tahun = tahunParam ? parseInt(tahunParam) : now.getFullYear();
  const tahunStr = tahun.toString();
  const sumdan = searchParams.get("sumdan") || "Dana kapitasi JKN";

  const isSuperAdmin = user.role === "superadmin" || user.level === 1;
  const kd_upt = searchParams.get("kd_upt") || (!isSuperAdmin ? (user.kd_upt || user.unit || "") : "");

  if (!kd_upt) {
    return NextResponse.json({ error: "Unit UPT wajib dipilih" }, { status: 400 });
  }

  try {
    // 1. Ambil Info UPT
    const upt = await prisma.msUpt.findFirst({
      where: { kd_upt },
    });

    // 2. Ambil Penandatangan KPA (kode 1)
    const penandatanganKpa = await prisma.penandatangan.findFirst({
      where: {
        kd_upt,
        kode: 1,
        status: 1,
      },
      orderBy: { id: "desc" },
    });

    // 3. Rentang Tanggal Bulan
    const startDate = new Date(tahun, bulan - 1, 1);
    const endDate = new Date(tahun, bulan, 1);

    // 4. Cek apakah ada record LPJ tersimpan
    let existingLpj: any = null;
    try {
      const rows: any[] = await prisma.$queryRawUnsafe(
        `SELECT * FROM "tbl_lpj" WHERE "kd_upt" = $1 AND "tahun" = $2 AND "bulan" = $3 AND "sumdan" = $4 LIMIT 1`,
        kd_upt,
        tahunStr,
        bulan,
        sumdan
      );
      if (rows && rows.length > 0) {
        existingLpj = rows[0];
        const rincianRows: any[] = await prisma.$queryRawUnsafe(
          `SELECT * FROM "tbl_rincian_lpj" WHERE "lpj_id" = $1 ORDER BY "id" ASC`,
          existingLpj.id
        );
        existingLpj.rincian = rincianRows;
      }
    } catch (e) {
      console.warn("Table tbl_lpj query failed in cetak:", e);
    }

    let no_lpj = existingLpj?.no_lpj || "";
    if (!no_lpj) {
      no_lpj = `DRAFT/${kd_upt}/SPTJ/${tahunStr}`;
    }

    let rincianPendapatan: Array<{ kd_rek6: string; nm_rek6: string; jumlah: number }> = [];
    let rincianBelanja: Array<{ kd_sub_kegiatan: string; nm_sub_kegiatan: string; kd_rek6: string; nm_rek6: string; full_kd_rek: string; jumlah: number }> = [];

    if (existingLpj && existingLpj.rincian && existingLpj.rincian.length > 0) {
      rincianPendapatan = existingLpj.rincian
        .filter((r: any) => r.jenis === "pendapatan")
        .map((r: any) => ({
          kd_rek6: r.kd_rek6 || "-",
          nm_rek6: r.nm_rek6 || "-",
          jumlah: Number(r.jumlah) || 0,
        }));

      rincianBelanja = existingLpj.rincian
        .filter((r: any) => r.jenis === "belanja")
        .map((r: any) => ({
          kd_sub_kegiatan: r.kd_sub_kegiatan || "",
          nm_sub_kegiatan: r.nm_sub_kegiatan || "",
          kd_rek6: r.kd_rek6 || "",
          nm_rek6: r.nm_rek6 || "-",
          full_kd_rek: r.kd_sub_kegiatan && r.kd_rek6 ? `${r.kd_sub_kegiatan}.${r.kd_rek6}` : (r.kd_rek6 || r.kd_sub_kegiatan || "-"),
          jumlah: Number(r.jumlah) || 0,
        }));
    } else {
      // Ambil realtime dari penerimaan dan pengeluaran
      const rawPenerimaan = await prisma.tblPenerimaan.findMany({
        where: {
          kdUnit: kd_upt,
          tglBukti: { gte: startDate, lt: endDate },
        },
      });

      const rawPengeluaran = await prisma.pengeluaran.findMany({
        where: {
          kd_upt,
          tgl_pengeluaran: { gte: startDate, lt: endDate },
        },
        include: {
          rincian: true,
        },
      });

      const pMap: Record<string, { kd_rek6: string; nm_rek6: string; jumlah: number }> = {};
      rawPenerimaan.forEach((p) => {
        const sDan = p.sumdan || "Dana kapitasi JKN";
        if (sumdan && !sDan.toLowerCase().includes(sumdan.toLowerCase()) && !sumdan.toLowerCase().includes(sDan.toLowerCase())) {
          return;
        }
        const key = p.kdRek6 || "lainnya";
        if (!pMap[key]) {
          pMap[key] = {
            kd_rek6: p.kdRek6 || "-",
            nm_rek6: p.nmRek6 || p.keterangan || "-",
            jumlah: 0,
          };
        }
        pMap[key].jumlah += Number(p.nilai) || 0;
      });

      const bMap: Record<string, { kd_sub_kegiatan: string; nm_sub_kegiatan: string; kd_rek6: string; nm_rek6: string; full_kd_rek: string; jumlah: number }> = {};
      rawPengeluaran.forEach((peng) => {
        if (peng.rincian && peng.rincian.length > 0) {
          peng.rincian.forEach((r) => {
            const sDan = r.sumdan || r.nm_sumdan || peng.sumdan || peng.nm_sumdan || "Dana kapitasi JKN";
            if (sumdan && !sDan.toLowerCase().includes(sumdan.toLowerCase()) && !sumdan.toLowerCase().includes(sDan.toLowerCase())) {
              return;
            }
            const kd_sub = r.kd_sub_kegiatan || peng.kd_sub_kegiatan || "";
            const kd_rek = r.kd_rek6 || peng.kd_rek6 || "";
            const fullKey = `${kd_sub}.${kd_rek}`;
            if (!bMap[fullKey]) {
              bMap[fullKey] = {
                kd_sub_kegiatan: kd_sub,
                nm_sub_kegiatan: r.nm_sub_kegiatan || peng.nm_sub_kegiatan || "-",
                kd_rek6: kd_rek,
                nm_rek6: r.nm_rek6 || peng.nm_rek6 || "-",
                full_kd_rek: kd_sub && kd_rek ? `${kd_sub}.${kd_rek}` : (kd_rek || kd_sub || "-"),
                jumlah: 0,
              };
            }
            bMap[fullKey].jumlah += Number(r.total) || (Number(r.volume) * Number(r.harga)) || 0;
          });
        } else {
          const sDan = peng.sumdan || peng.nm_sumdan || "Dana kapitasi JKN";
          if (sumdan && !sDan.toLowerCase().includes(sumdan.toLowerCase()) && !sumdan.toLowerCase().includes(sDan.toLowerCase())) {
            return;
          }
          const kd_sub = peng.kd_sub_kegiatan || "";
          const kd_rek = peng.kd_rek6 || "";
          const fullKey = `${kd_sub}.${kd_rek}`;
          if (!bMap[fullKey]) {
            bMap[fullKey] = {
              kd_sub_kegiatan: kd_sub,
              nm_sub_kegiatan: peng.nm_sub_kegiatan || "-",
              kd_rek6: kd_rek,
              nm_rek6: peng.nm_rek6 || "-",
              full_kd_rek: kd_sub && kd_rek ? `${kd_sub}.${kd_rek}` : (kd_rek || kd_sub || "-"),
              jumlah: 0,
            };
          }
          bMap[fullKey].jumlah += Number(peng.nilai_pengeluaran) || 0;
        }
      });

      rincianPendapatan = Object.values(pMap);
      rincianBelanja = Object.values(bMap);
    }

    const totalPendapatan = rincianPendapatan.reduce((s, r) => s + r.jumlah, 0);
    const totalBelanja = rincianBelanja.reduce((s, r) => s + r.jumlah, 0);

    // Siapkan baris berdampingan (Paired rows)
    const maxRows = Math.max(rincianPendapatan.length, rincianBelanja.length, 1);
    const pairedRows: Array<{
      pendapatan: { kd_rek6: string; nm_rek6: string; jumlah: number } | null;
      belanja: { full_kd_rek: string; nm_rek6: string; jumlah: number } | null;
    }> = [];

    for (let i = 0; i < maxRows; i++) {
      pairedRows.push({
        pendapatan: rincianPendapatan[i] || null,
        belanja: rincianBelanja[i] || null,
      });
    }

    return NextResponse.json({
      success: true,
      no_lpj,
      bulan,
      tahun,
      sumdan,
      totalPendapatan,
      totalBelanja,
      pairedRows,
      rincianPendapatan,
      rincianBelanja,
      upt,
      penandatanganKpa,
    });
  } catch (error: any) {
    console.error("Cetak LPJ Error:", error);
    return NextResponse.json({ error: error.message || "Gagal memuat dokumen cetak LPJ" }, { status: 500 });
  }
}
