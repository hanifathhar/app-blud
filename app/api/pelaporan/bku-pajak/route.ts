export const runtime = "nodejs";

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
    const tahunStr = tahun.toString();

    const kd_upt = isSuperAdmin
      ? (searchParams.get("kd_upt") || user.kd_upt || user.unit || "")
      : (user.kd_upt || user.unit || "");

    if (!kd_upt) {
      return NextResponse.json({ error: "Unit / UPT wajib dipilih" }, { status: 400 });
    }

    // 1. Fetch Informasi UPT
    const upt = await prisma.msUpt.findFirst({
      where: { kd_upt },
    });

    // 2. Fetch Penandatangan (KPA & Bendahara Pengeluaran)
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

    // 3. Hitung Saldo Bulan Lalu (Kumulatif Pemotongan - Penyetoran Pajak s/d Bulan - 1)
    const startDateYear = new Date(Date.UTC(tahun, 0, 1, 0, 0, 0));
    const startDateMonth = new Date(Date.UTC(tahun, bulan - 1, 1, 0, 0, 0));
    const endDateMonth = new Date(Date.UTC(tahun, bulan, 1, 0, 0, 0));

    let saldoBulanLalu = 0;
    let pemotonganSdPeriodeLalu = 0;
    let penyetoranSdPeriodeLalu = 0;

    if (bulan > 1) {
      // Ambil seluruh potongan sebelum bulan ini pada tahun berjalan
      const prevPotongan = await prisma.potonganPengeluaran.findMany({
        where: {
          kd_upt: kd_upt,
          tahun: tahunStr,
          tgl_potongan: {
            gte: startDateYear,
            lt: startDateMonth,
          },
        },
      });

      pemotonganSdPeriodeLalu = prevPotongan.reduce((acc, p) => acc + (Number(p.nilai) || 0), 0);

      // Ambil seluruh penyetoran sebelum bulan ini pada tahun berjalan
      const prevSetoran = await prisma.potonganPengeluaran.findMany({
        where: {
          kd_upt: kd_upt,
          tahun: tahunStr,
          status_setor: "disetor",
          tgl_setor: {
            gte: startDateYear,
            lt: startDateMonth,
          },
        },
      });

      penyetoranSdPeriodeLalu = prevSetoran.reduce((acc, p) => acc + (Number(p.nilai) || 0), 0);
      saldoBulanLalu = pemotonganSdPeriodeLalu - penyetoranSdPeriodeLalu;
    }

    // 4. Ambil Transaksi Pajak Bulan Ini (Pemotongan & Penyetoran)
    // A. Transaksi Pemotongan Pajak pada bulan ini
    const potBulanIni = await prisma.potonganPengeluaran.findMany({
      where: {
        kd_upt: kd_upt,
        tahun: tahunStr,
        tgl_potongan: {
          gte: startDateMonth,
          lt: endDateMonth,
        },
      },
      include: {
        pengeluaran: true,
      },
      orderBy: [{ tgl_potongan: "asc" }, { id: "asc" }],
    });

    // B. Transaksi Penyetoran Pajak pada bulan ini
    const setorBulanIni = await prisma.potonganPengeluaran.findMany({
      where: {
        kd_upt: kd_upt,
        tahun: tahunStr,
        status_setor: "disetor",
        tgl_setor: {
          gte: startDateMonth,
          lt: endDateMonth,
        },
      },
      include: {
        pengeluaran: true,
      },
      orderBy: [{ tgl_setor: "asc" }, { id: "asc" }],
    });

    // Gabungkan dan urutkan transaksi secara kronologis
    type RawTaxTx = {
      id: number;
      tgl: Date;
      no_transaksi: string;
      ref: string;
      kd_rek6: string;
      nm_rek6: string;
      uraian: string;
      pemotongan: number;
      penyetoran: number;
    };

    const combinedList: RawTaxTx[] = [];

    // Helper untuk menyusun uraian pengeluaran
    const formatUraianPotongan = (p: any, namaPajak: string, noTransaksi: string) => {
      const ketPengeluaran = p.pengeluaran?.keterangan;
      if (ketPengeluaran) {
        // contoh: "Dipungut PPN atas pembayaran belanja makan minum rapat"
        return `Dipungut ${namaPajak} atas ${ketPengeluaran}`;
      }
      if (p.keterangan) {
        return p.keterangan;
      }
      return `Dipungut ${namaPajak} atas pembayaran transaksi ${noTransaksi}`;
    };

    const formatUraianSetoran = (p: any, namaPajak: string, noTransaksi: string) => {
      const ketPengeluaran = p.pengeluaran?.keterangan;
      if (ketPengeluaran) {
        return `Disetor ${namaPajak} atas ${ketPengeluaran}`;
      }
      return `Disetor ${namaPajak} atas pembayaran transaksi ${noTransaksi}`;
    };

    // A. Masukkan Pemotongan Pajak (Ref = ID Billing)
    potBulanIni.forEach((p) => {
      const nominal = Number(p.nilai) || 0;
      if (nominal > 0) {
        const noTransaksi = p.pengeluaran?.no_pengeluaran || "-";
        const ref = p.id_billing || "-";
        const namaPajak = p.nm_rek6 || "Pajak";
        const kodeRek = p.kd_rek6 || "";
        const uraian = formatUraianPotongan(p, namaPajak, noTransaksi);

        combinedList.push({
          id: p.id,
          tgl: p.tgl_potongan ? new Date(p.tgl_potongan) : new Date(),
          no_transaksi: noTransaksi,
          ref: ref,
          kd_rek6: kodeRek,
          nm_rek6: namaPajak,
          uraian: uraian,
          pemotongan: nominal,
          penyetoran: 0,
        });
      }
    });

    // B. Masukkan Penyetoran Pajak (Ref = NTPN)
    setorBulanIni.forEach((p) => {
      const nominal = Number(p.nilai) || 0;
      if (nominal > 0) {
        const noTransaksi = p.pengeluaran?.no_pengeluaran || "-";
        const ref = p.no_ntpn || p.id_billing || "-";
        const namaPajak = p.nm_rek6 || "Pajak";
        const kodeRek = p.kd_rek6 || "";
        const uraian = formatUraianSetoran(p, namaPajak, noTransaksi);

        combinedList.push({
          id: p.id + 1000000,
          tgl: p.tgl_setor ? new Date(p.tgl_setor) : new Date(),
          no_transaksi: noTransaksi,
          ref: ref,
          kd_rek6: kodeRek,
          nm_rek6: namaPajak,
          uraian: uraian,
          pemotongan: 0,
          penyetoran: nominal,
        });
      }
    });

    // Urutkan berdasarkan tanggal transaksi
    combinedList.sort((a, b) => a.tgl.getTime() - b.tgl.getTime());

    // Hitung Saldo Kumulatif Berjalan
    let runningSaldo = saldoBulanLalu;
    let totalPemotonganBulanIni = 0;
    let totalPenyetoranBulanIni = 0;

    const items = combinedList.map((item, idx) => {
      runningSaldo = runningSaldo + item.pemotongan - item.penyetoran;
      totalPemotonganBulanIni += item.pemotongan;
      totalPenyetoranBulanIni += item.penyetoran;

      // Rekening Potongan Format: "[Kode] - [Nama]" atau "[Nama]"
      const rekeningPotongan = item.kd_rek6
        ? `${item.kd_rek6} - ${item.nm_rek6}`
        : item.nm_rek6;

      return {
        id: item.id,
        no_urut: idx + 1,
        tgl_transaksi: item.tgl,
        no_transaksi: item.no_transaksi,
        ref: item.ref,
        rekening_potongan: rekeningPotongan,
        kd_rek6: item.kd_rek6,
        nm_rek6: item.nm_rek6,
        uraian: item.uraian,
        pemotongan: item.pemotongan,
        penyetoran: item.penyetoran,
        saldo: runningSaldo,
      };
    });

    const totalPemotonganSdPeriodeIni = pemotonganSdPeriodeLalu + totalPemotonganBulanIni;
    const totalPenyetoranSdPeriodeIni = penyetoranSdPeriodeLalu + totalPenyetoranBulanIni;
    const saldoAkhir = runningSaldo;

    return NextResponse.json({
      success: true,
      bulan,
      tahun,
      kd_upt,
      upt,
      penandatanganKpa,
      penandatanganBendahara,
      saldoBulanLalu,
      items,
      summary: {
        totalPemotonganBulanIni,
        totalPenyetoranBulanIni,
        pemotonganSdPeriodeLalu,
        penyetoranSdPeriodeLalu,
        totalPemotonganSdPeriodeIni,
        totalPenyetoranSdPeriodeIni,
        saldoAkhir,
      },
    });
  } catch (error: any) {
    console.error("BKU Pajak API Error:", error);
    return NextResponse.json({ error: error.message || "Gagal memuat laporan Buku Pembantu Pajak" }, { status: 500 });
  }
}
