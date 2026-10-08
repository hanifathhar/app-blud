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

    const kd_sub_kegiatan = searchParams.get("kd_sub_kegiatan") || "";
    const kd_rek6 = searchParams.get("kd_rek6") || "";

    if (!kd_upt) {
      return NextResponse.json({ error: "Unit / UPT wajib dipilih" }, { status: 400 });
    }

    // 1. Fetch Informasi UPT
    const upt = await prisma.msUpt.findFirst({
      where: { kd_upt },
    });

    // 2. Fetch Informasi Sub Kegiatan (Nama, Kegiatan, Program)
    let infoSubGiat: any = null;
    if (kd_sub_kegiatan) {
      infoSubGiat = await prisma.mSubGiat.findFirst({
        where: { kd_sub_kegiatan },
      });
      if (!infoSubGiat) {
        const fromRba = await prisma.tblRbaRincianPenetapan.findFirst({
          where: { kdSubKegiatan: kd_sub_kegiatan },
          select: { kdSubKegiatan: true, nmSubKegiatan: true },
        });
        if (fromRba) {
          infoSubGiat = {
            kd_sub_kegiatan: fromRba.kdSubKegiatan,
            nm_sub_kegiatan: fromRba.nmSubKegiatan,
          };
        }
      }
    }

    // Susun format kode hierarki kegiatan jika ada (misal: 1.02.1.02.5.02.0.00.02.00.01.2.02.07)
    let formattedSubKegiatanKode = kd_sub_kegiatan;
    if (kd_sub_kegiatan && kd_upt) {
      // Jika kd_sub_kegiatan belum prefix lengkap dengan UPT, gabungkan sesuai format pemda
      if (!kd_sub_kegiatan.startsWith(kd_upt) && !kd_sub_kegiatan.startsWith("1.02")) {
        formattedSubKegiatanKode = `1.02.${kd_upt}.${kd_sub_kegiatan}`;
      }
    }

    // 3. Fetch Informasi Rekening
    let infoRek6: any = null;
    if (kd_rek6) {
      infoRek6 = await prisma.msRek6.findFirst({
        where: { kd_rek6 },
      });
      if (!infoRek6) {
        const fromRbaRek = await prisma.tblRbaRincianPenetapan.findFirst({
          where: { kd_rek6 },
          select: { kd_rek6: true, nm_rek6: true },
        });
        if (fromRbaRek) {
          infoRek6 = {
            kd_rek6: fromRbaRek.kd_rek6,
            nm_rek6: fromRbaRek.nm_rek6,
          };
        }
      }
    }

    // 4. Fetch Anggaran APBD & PAPBD dari Penetapan RBA Aktif (is_aktif = true)
    let anggaranApbd = 0;
    let anggaranPapbd = 0;

    if (kd_sub_kegiatan && kd_rek6) {
      // HANYA RBA Penetapan yang statusnya AKTIF (is_aktif = true) untuk UPT & Tahun ini
      const murniRba = await prisma.tblRbaRincianPenetapan.findMany({
        where: {
          tahun: tahunStr,
          kdUnit: kd_upt,
          kdSubKegiatan: kd_sub_kegiatan,
          kd_rek6: kd_rek6,
          rba_penetapan: {
            is_aktif: true,
          },
        },
      });

      if (murniRba.length > 0) {
        anggaranApbd = murniRba.reduce((sum, item) => sum + (Number(item.total) || Number(item.nilai) || 0), 0);
        anggaranPapbd = anggaranApbd;
      }
    }

    // 5. Fetch Penandatangan (KPA & Bendahara Pengeluaran)
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

    // 6. Hitung Jumlah s/d Periode Lalu (Bulan 1 s/d Bulan - 1)
    let totalLsLalu = 0;
    let totalUpGuTuLalu = 0;

    if (bulan > 1) {
      const prevBku = await prisma.bKU.findMany({
        where: {
          kd_upt: kd_upt,
          tahun: tahun,
          bulan: { lt: bulan },
          kredit: { gt: 0 },
          ...(kd_sub_kegiatan ? { kd_sub_kegiatan } : {}),
          ...(kd_rek6 ? { kd_rek6 } : {}),
        },
        include: {
          tagihan: {
            include: {
              spp: true,
            },
          },
        },
      });

      for (const row of prevBku) {
        const nominal = Number(row.kredit) || 0;
        let jenisSpp = "UP";
        if (row.tagihan?.spp && row.tagihan.spp.length > 0) {
          jenisSpp = (row.tagihan.spp[0].jenis_spp || "UP").toUpperCase();
        } else if (row.uraian?.toUpperCase().includes("LS") || row.no_bukti?.toUpperCase().includes("LS")) {
          jenisSpp = "LS";
        }

        if (jenisSpp === "LS") {
          totalLsLalu += nominal;
        } else {
          totalUpGuTuLalu += nominal;
        }
      }
    }

    // 7. Ambil Transaksi BKU Bulan Ini
    const currentBku = await prisma.bKU.findMany({
      where: {
        kd_upt: kd_upt,
        tahun: tahun,
        bulan: bulan,
        kredit: { gt: 0 },
        ...(kd_sub_kegiatan ? { kd_sub_kegiatan } : {}),
        ...(kd_rek6 ? { kd_rek6 } : {}),
      },
      include: {
        tagihan: {
          include: {
            spp: true,
            pengeluaran: true,
          },
        },
      },
      orderBy: [{ tgl_transaksi: "asc" }, { id: "asc" }],
    });

    let totalLsBulanIni = 0;
    let totalUpGuTuBulanIni = 0;

    const items = currentBku.map((row) => {
      const nominal = Number(row.kredit) || 0;
      let jenisSpp = "UP";
      if (row.tagihan?.spp && row.tagihan.spp.length > 0) {
        jenisSpp = (row.tagihan.spp[0].jenis_spp || "UP").toUpperCase();
      } else if (row.uraian?.toUpperCase().includes("LS") || row.no_bukti?.toUpperCase().includes("LS")) {
        jenisSpp = "LS";
      }

      let ls = 0;
      let up_gu_tu = 0;

      if (jenisSpp === "LS") {
        ls = nominal;
        totalLsBulanIni += ls;
      } else {
        up_gu_tu = nominal;
        totalUpGuTuBulanIni += up_gu_tu;
      }

      return {
        id: row.id,
        no_bukti: row.no_bukti || "",
        tgl_transaksi: row.tgl_transaksi,
        uraian: row.uraian || "",
        ls,
        up_gu_tu,
        total: ls + up_gu_tu,
      };
    });

    // 8. Hitung Total / Summary Baris Bawah
    const totalBulanIni = totalLsBulanIni + totalUpGuTuBulanIni;
    const totalSdPeriodeLalu = totalLsLalu + totalUpGuTuLalu;
    const totalSdPeriodeIniLs = totalLsLalu + totalLsBulanIni;
    const totalSdPeriodeIniUpGuTu = totalUpGuTuLalu + totalUpGuTuBulanIni;
    const totalSdPeriodeIni = totalSdPeriodeIniLs + totalSdPeriodeIniUpGuTu;

    const sisaAnggaran = (anggaranPapbd || anggaranApbd) - totalSdPeriodeIni;

    return NextResponse.json({
      success: true,
      bulan,
      tahun,
      kd_upt,
      kd_sub_kegiatan,
      formattedSubKegiatanKode,
      kd_rek6,
      upt,
      infoSubGiat,
      infoRek6,
      anggaranApbd,
      anggaranPapbd,
      penandatanganKpa,
      penandatanganBendahara,
      items,
      summary: {
        totalLsBulanIni,
        totalUpGuTuBulanIni,
        totalBulanIni,

        totalLsLalu,
        totalUpGuTuLalu,
        totalSdPeriodeLalu,

        totalSdPeriodeIniLs,
        totalSdPeriodeIniUpGuTu,
        totalSdPeriodeIni,

        sisaAnggaran,
      },
    });
  } catch (error: any) {
    console.error("BKU Rincian Objek API Error:", error);
    return NextResponse.json({ error: error.message || "Gagal memuat laporan BKU Rincian Objek" }, { status: 500 });
  }
}
