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

    const bulanParam = searchParams.get("bulan");
    const bulan = bulanParam ? parseInt(bulanParam) : new Date().getMonth() + 1; // 1-12
    const tahun = parseInt(searchParams.get("tahun") || new Date().getFullYear().toString());
    const tahunStr = tahun.toString();

    const kd_upt = isSuperAdmin
      ? (searchParams.get("kd_upt") || user.kd_upt || user.unit || "")
      : (user.kd_upt || user.unit || "");

    if (!kd_upt) {
      return NextResponse.json({ error: "Unit / UPT wajib dipilih" }, { status: 400 });
    }

    if (!bulan || bulan < 1 || bulan > 12) {
      return NextResponse.json({ error: "Bulan harus dipilih (Januari - Desember)" }, { status: 400 });
    }

    // 1. Fetch Informasi UPT
    const upt = await prisma.msUpt.findFirst({
      where: { kd_upt },
    });

    // 2. Fetch Penandatangan (Pengguna Anggaran / KPA kode 1, Bendahara Pengeluaran kode 5)
    const penandatanganKpa = await prisma.penandatangan.findFirst({
      where: {
        kd_upt: kd_upt,
        kode: 1,
        status: 1,
      },
      orderBy: { id: "desc" },
    });

    const penandatanganBendahara = await prisma.penandatangan.findFirst({
      where: {
        kd_upt: kd_upt,
        kode: 5,
        status: 1,
      },
      orderBy: { id: "desc" },
    });

    // 3. Ambil data Pengeluaran Belanja (tbl_pengeluaran) per bulan yang dipilih
    const startDateMonth = new Date(Date.UTC(tahun, bulan - 1, 1, 0, 0, 0));
    const endDateMonth = new Date(Date.UTC(tahun, bulan, 1, 0, 0, 0));

    const pengeluaranList = await prisma.pengeluaran.findMany({
      where: {
        kd_upt: kd_upt,
        tgl_pengeluaran: {
          gte: startDateMonth,
          lt: endDateMonth,
        },
      },
      include: {
        rincian: true,
        tagihan: {
          include: {
            spp: true,
            rincian: true,
          },
        },
      },
      orderBy: [{ tgl_pengeluaran: "asc" }, { id: "asc" }],
    });

    // Format item register SPJ dari seluruh data pengeluaran
    const items = pengeluaranList.map((peng, idx) => {
      const tglSpj = peng.tgl_pengeluaran ? new Date(peng.tgl_pengeluaran) : new Date();
      
      let nominal = 0;
      if (peng.rincian && peng.rincian.length > 0) {
        nominal = peng.rincian.reduce((sum, r) => sum + (Number(r.total) || 0), 0);
      } else {
        nominal = Number(peng.nilai_pengeluaran) || 0;
      }

      // Klasifikasi jenis SPJ (SPJ-LS, SPJ-GU, SPJ-TU, SPJ-UP)
      let jenis = "SPJ-GU";
      if (peng.tagihan?.spp && peng.tagihan.spp.length > 0) {
        const jSpp = peng.tagihan.spp[0].jenis_spp?.toUpperCase();
        if (jSpp === "LS") jenis = "SPJ-LS";
        else if (jSpp === "TU") jenis = "SPJ-TU";
        else if (jSpp === "UP") jenis = "SPJ-UP";
        else jenis = "SPJ-GU";
      } else if (peng.no_pengeluaran?.toUpperCase().includes("LS") || peng.keterangan?.toUpperCase().includes("LS")) {
        jenis = "SPJ-LS";
      }

      // Kumpulkan informasi Sub Kegiatan dan Rekening Belanja
      const subKegiatanList: string[] = [];
      const rekeningList: string[] = [];

      // Cek dari rincian pengeluaran
      if (peng.rincian && peng.rincian.length > 0) {
        peng.rincian.forEach((r) => {
          if (r.nm_sub_kegiatan && !subKegiatanList.includes(r.nm_sub_kegiatan)) {
            subKegiatanList.push(r.nm_sub_kegiatan);
          } else if (r.kd_sub_kegiatan && !subKegiatanList.includes(r.kd_sub_kegiatan)) {
            subKegiatanList.push(r.kd_sub_kegiatan);
          }

          const rekName = r.nm_rek6 || r.kd_rek6;
          if (rekName && !rekeningList.includes(rekName)) {
            rekeningList.push(rekName);
          }
        });
      }

      // Jika belum ditemukan di rincian pengeluaran, cek dari header pengeluaran atau tagihan
      if (subKegiatanList.length === 0) {
        if (peng.nm_sub_kegiatan) subKegiatanList.push(peng.nm_sub_kegiatan);
        else if (peng.kd_sub_kegiatan) subKegiatanList.push(peng.kd_sub_kegiatan);
        else if (peng.tagihan?.nm_sub_kegiatan) subKegiatanList.push(peng.tagihan.nm_sub_kegiatan);
        else if (peng.tagihan?.kd_sub_kegiatan) subKegiatanList.push(peng.tagihan.kd_sub_kegiatan);
      }

      if (rekeningList.length === 0) {
        if (peng.nm_rek6) rekeningList.push(peng.nm_rek6);
        else if (peng.kd_rek6) rekeningList.push(peng.kd_rek6);
        else if (peng.tagihan?.nm_rek6) rekeningList.push(peng.tagihan.nm_rek6);
        else if (peng.tagihan?.kd_rek6) rekeningList.push(peng.tagihan.kd_rek6);
      }

      const baseUraian = peng.keterangan || (peng.nm_vendor ? `Pembayaran kepada ${peng.nm_vendor}` : "Belanja Pengeluaran");
      const subGiatStr = subKegiatanList.length > 0 ? subKegiatanList.join(", ") : "";
      const rekStr = rekeningList.length > 0 ? rekeningList.join(", ") : "";

      // Status pengesahan / verifikasi
      let statusStr = "DISETUJUI";
      if (peng.pengesahan === 1) {
        statusStr = "DISAHKAN";
      } else if (peng.verif === 1) {
        statusStr = "DIVERIFIKASI";
      }

      return {
        id: peng.id,
        no_urut: idx + 1,
        tgl_spj: tglSpj,
        no_spj: peng.no_pengeluaran,
        uraian: baseUraian,
        sub_kegiatan: subGiatStr,
        rekening_belanja: rekStr,
        jenis_spj: jenis,
        jumlah_belanja: nominal,
        status: statusStr,
        disahkan_oleh: peng.user_verif || "-",
        tgl_disahkan: peng.tgl_verif,
        sumdan: peng.sumdan || "BLUD",
      };
    });

    const totalJumlahSpj = items.reduce((acc, curr) => acc + curr.jumlah_belanja, 0);

    return NextResponse.json({
      success: true,
      bulan,
      tahun,
      kd_upt,
      upt,
      penandatanganKpa,
      penandatanganBendahara,
      items,
      summary: {
        totalJumlahSpj,
        totalDokumen: items.length,
      },
    });
  } catch (error: any) {
    console.error("Register SPJ API Error:", error);
    return NextResponse.json({ error: error.message || "Gagal memuat data Register SPJ" }, { status: 500 });
  }
}
