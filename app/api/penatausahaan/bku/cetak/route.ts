import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isSuperAdmin = user.role === "superadmin" || user.level === 1;
    const { searchParams } = new URL(req.url);
    const bulan = parseInt(searchParams.get("bulan") || "1");
    const tahun = parseInt(searchParams.get("tahun") || new Date().getFullYear().toString());
    const kd_upt = isSuperAdmin
      ? (searchParams.get("kd_upt") || user.kd_upt || user.unit)
      : (user.kd_upt || user.unit);

    if (!kd_upt) {
      return NextResponse.json({ error: "UPT tidak valid atau belum dipilih" }, { status: 400 });
    }

    // 1. Fetch UPT info
    const upt = await prisma.msUpt.findFirst({
      where: { kd_upt },
    });

    // 2. Fetch Urusan
    const urusan = await prisma.msUrusan.findFirst({
      where: { kd_urusan: "1.02" },
    });

    // 3. Hitung Saldo Bulan Lalu (Kumulatif transaksi sebelum bulan ini pada tahun berjalan)
    const prevTransactions = await prisma.bKU.findMany({
      where: {
        kd_upt: kd_upt,
        tahun: tahun,
        bulan: { lt: bulan },
      },
      select: {
        debet: true,
        kredit: true,
      },
    });

    const saldoBulanLalu = prevTransactions.reduce((acc, curr) => {
      return acc + (Number(curr.debet) || 0) - (Number(curr.kredit) || 0);
    }, 0);

    // 4. Ambil Transaksi BKU Bulan Ini
    const currentTransactions = await prisma.bKU.findMany({
      where: {
        kd_upt: kd_upt,
        tahun: tahun,
        bulan: bulan,
      },
      include: {
        tagihan: {
          include: {
            rincian: true,
            pengeluaran: {
              include: {
                rincian: true,
              },
            },
          },
        },
      },
      orderBy: [{ tgl_transaksi: "asc" }, { id: "asc" }],
    });

    // 5. Fetch Penandatangan pada UPT terkait
    // KPA: kode 1
    // Bendahara Pengeluaran: kode 5
    const penandatanganKpa = await prisma.penandatangan.findFirst({
      where: {
        kd_upt: kd_upt,
        kode: 1, // KPA
        status: 1,
      },
      orderBy: { id: "desc" },
    });

    const penandatanganBendahara = await prisma.penandatangan.findFirst({
      where: {
        kd_upt: kd_upt,
        kode: 5, // Bendahara Pengeluaran
        status: 1,
      },
      orderBy: { id: "desc" },
    });

    // Fetch daftar nama rekening dan nomor bukti untuk pencarian sub kegiatan
    const allKdRek = Array.from(new Set(currentTransactions.map((d) => d.kd_rek6).filter(Boolean))) as string[];
    let mapRek6: Record<string, string> = {};
    if (allKdRek.length > 0) {
      const listRek6 = await prisma.msRek6.findMany({
        where: { kd_rek6: { in: allKdRek } },
        select: { kd_rek6: true, nm_rek6: true },
      });
      listRek6.forEach((r) => {
        if (r.kd_rek6) mapRek6[r.kd_rek6] = r.nm_rek6 || "";
      });
    }

    const allNoBukti = Array.from(new Set(currentTransactions.map((d) => d.no_bukti).filter(Boolean))) as string[];
    
    // Mapping Sub Kegiatan dari Penerimaan
    const penerimaanList = allNoBukti.length > 0 ? await prisma.tblPenerimaan.findMany({
      where: {
        noBukti: { in: allNoBukti },
        kdUnit: kd_upt,
      },
      select: {
        noBukti: true,
        kdSubKegiatan: true,
        kdRek6: true,
        nmRek6: true,
      },
    }) : [];
    const mapPenerimaan: Record<string, any> = {};
    penerimaanList.forEach((p) => {
      if (p.noBukti) mapPenerimaan[p.noBukti] = p;
    });

    // Mapping Sub Kegiatan dari Pengeluaran langsung jika tidak lewat tagihan
    const pengeluaranList = allNoBukti.length > 0 ? await prisma.pengeluaran.findMany({
      where: {
        no_pengeluaran: { in: allNoBukti },
        kd_upt: kd_upt,
      },
      include: {
        rincian: true,
      },
    }) : [];
    const mapPengeluaran: Record<string, any> = {};
    pengeluaranList.forEach((peng) => {
      if (peng.no_pengeluaran) mapPengeluaran[peng.no_pengeluaran] = peng;
    });

    // 6. Format baris transaksi dengan perhitungan saldo kumulatif berjalan
    let runningSaldo = saldoBulanLalu;
    const items = currentTransactions.map((tx: any, idx) => {
      const debet = Number(tx.debet) || 0;
      const kredit = Number(tx.kredit) || 0;
      runningSaldo = runningSaldo + debet - kredit;

      // Extract sub kegiatan dan rekening
      let kd_sub_kegiatan = tx.tagihan?.kd_sub_kegiatan || tx.tagihan?.pengeluaran?.kd_sub_kegiatan || "";
      const kd_rek6 = tx.kd_rek6 || tx.tagihan?.kd_rek6 || "";

      if (!kd_sub_kegiatan && tx.tagihan?.rincian) {
        const found = tx.tagihan.rincian.find((r: any) => r.kd_rek6 === kd_rek6);
        if (found?.kd_sub_kegiatan) kd_sub_kegiatan = found.kd_sub_kegiatan;
      }
      if (!kd_sub_kegiatan && tx.tagihan?.pengeluaran?.rincian) {
        const found = tx.tagihan.pengeluaran.rincian.find((r: any) => r.kd_rek6 === kd_rek6);
        if (found?.kd_sub_kegiatan) kd_sub_kegiatan = found.kd_sub_kegiatan;
      }
      if (!kd_sub_kegiatan && tx.no_bukti && mapPengeluaran[tx.no_bukti]) {
        const directPeng = mapPengeluaran[tx.no_bukti];
        kd_sub_kegiatan = directPeng.kd_sub_kegiatan || "";
        if (!kd_sub_kegiatan && directPeng.rincian) {
          const found = directPeng.rincian.find((r: any) => r.kd_rek6 === kd_rek6);
          if (found?.kd_sub_kegiatan) kd_sub_kegiatan = found.kd_sub_kegiatan;
        }
      }
      if (!kd_sub_kegiatan && tx.no_bukti && mapPenerimaan[tx.no_bukti]) {
        kd_sub_kegiatan = mapPenerimaan[tx.no_bukti].kdSubKegiatan || "";
      }

      let nm_rek6 = mapRek6[kd_rek6] || "";
      if (!nm_rek6 && tx.tagihan?.rincian) {
        const found = tx.tagihan.rincian.find((r: any) => r.kd_rek6 === kd_rek6);
        if (found) nm_rek6 = found.nm_rek6 || "";
      }
      if (!nm_rek6 && tx.tagihan?.pengeluaran?.rincian) {
        const found = tx.tagihan.pengeluaran.rincian.find((r: any) => r.kd_rek6 === kd_rek6);
        if (found) nm_rek6 = found.nm_rek6 || "";
      }
      if (!nm_rek6 && tx.no_bukti && mapPengeluaran[tx.no_bukti]?.rincian) {
        const found = mapPengeluaran[tx.no_bukti].rincian.find((r: any) => r.kd_rek6 === kd_rek6);
        if (found) nm_rek6 = found.nm_rek6 || "";
      }
      if (!nm_rek6 && tx.no_bukti && mapPenerimaan[tx.no_bukti]) {
        nm_rek6 = mapPenerimaan[tx.no_bukti].nmRek6 || "";
      }

      // Format gabungan kode sub kegiatan.kode rekening
      const full_kd_rek = kd_sub_kegiatan && kd_rek6
        ? `${kd_sub_kegiatan}.${kd_rek6}`
        : (kd_sub_kegiatan || kd_rek6 || "");

      return {
        id: tx.id,
        no_urut: String(idx + 1).padStart(6, "0"),
        tgl_transaksi: tx.tgl_transaksi,
        no_bukti: tx.no_bukti,
        uraian: tx.uraian,
        kd_sub_kegiatan,
        kd_rek6,
        full_kd_rek,
        nm_rek6,
        debet,
        kredit,
        saldo: runningSaldo,
      };
    });

    const totalDebet = items.reduce((s, r) => s + r.debet, 0);
    const totalKredit = items.reduce((s, r) => s + r.kredit, 0);

    return NextResponse.json({
      success: true,
      bulan,
      tahun,
      saldoBulanLalu,
      totalDebet,
      totalKredit,
      saldoAkhir: runningSaldo,
      items,
      upt,
      urusan,
      penandatanganKpa,
      penandatanganBendahara,
    });
  } catch (error: any) {
    console.error("Cetak BKU API Error:", error);
    return NextResponse.json({ error: error.message || "Gagal memuat data cetak BKU" }, { status: 500 });
  }
}
