import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isSuperAdmin = user.role === "superadmin" || user.level === 1;
    const isBendahara = user.role === "bendahara" || user.level === 5;
    const isKeuangan = user.role === "keuangan" || user.level === 4;
    const isKpa = user.role === "kpa" || user.level === 2;

    if (!isSuperAdmin && !isBendahara && !isKeuangan && !isKpa) {
      return NextResponse.json({ error: "Forbidden: Anda tidak memiliki hak akses untuk posting BKU" }, { status: 403 });
    }

    const body = await req.json();
    const bulan = parseInt(body.bulan);
    const tahun = parseInt(body.tahun);
    const kd_upt = isSuperAdmin ? (body.kd_upt || user.kd_upt || user.unit) : (user.kd_upt || user.unit);

    if (isNaN(bulan) || bulan < 1 || bulan > 12) {
      return NextResponse.json({ error: "Bulan tidak valid (1 - 12)" }, { status: 400 });
    }
    if (isNaN(tahun) || tahun < 2000) {
      return NextResponse.json({ error: "Tahun tidak valid" }, { status: 400 });
    }
    if (!kd_upt) {
      return NextResponse.json({ error: "UPT wajib dipilih" }, { status: 400 });
    }

    const startDate = new Date(Date.UTC(tahun, bulan - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(tahun, bulan, 1, 0, 0, 0));

    // 1. Ambil Pendapatan / Penerimaan Kas (tbl_penerimaan)
    const penerimaanList = await prisma.tblPenerimaan.findMany({
      where: {
        kdUnit: kd_upt,
        tglBukti: {
          gte: startDate,
          lt: endDate,
        },
      },
      orderBy: [{ tglBukti: "asc" }, { idTerima: "asc" }],
    });

    // 2. Ambil Pengeluaran Kas (tbl_pengeluaran & tbl_rincian_pengeluaran)
    const pengeluaranList = await prisma.pengeluaran.findMany({
      where: {
        kd_upt: kd_upt,
        tgl_pengeluaran: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {
        rincian: {
          orderBy: { id: "asc" },
        },
      },
      orderBy: [{ tgl_pengeluaran: "asc" }, { id: "asc" }],
    });

    // 3. Proses Transaksi Sinkronisasi BKU
    const result = await prisma.$transaction(async (tx) => {
      // Hapus data BKU bulan & tahun tersebut untuk UPT ini agar tidak duplikat
      await tx.bKU.deleteMany({
        where: {
          kd_upt: kd_upt,
          bulan: bulan,
          tahun: tahun,
        },
      });

      const bkuInsertData: any[] = [];

      // A. Masukkan Penerimaan (Debet)
      for (const p of penerimaanList) {
        const nominal = Number(p.nilai) || 0;
        if (nominal <= 0) continue;

        bkuInsertData.push({
          kd_upt: kd_upt,
          no_bukti: p.noBukti || "-",
          tgl_transaksi: p.tglBukti ? new Date(p.tglBukti) : new Date(),
          uraian: p.keterangan || `Penerimaan - ${p.nmRek6 || p.nmPenyetor || "-"}`,
          debet: nominal,
          kredit: 0,
          saldo: 0,
          kd_rek6: p.kdRek6 || null,
          jenis: p.jenis === "2" || (p.jenis && p.jenis.toLowerCase() === "bank") ? "bank" : "kas",
          bulan: bulan,
          tahun: tahun,
          dibuat_oleh: user.id || null,
        });
      }

      // B. Masukkan Pengeluaran (Kredit)
      for (const peng of pengeluaranList) {
        // Ambil uraian dari header pengeluaran
        const uraianHeader = peng.keterangan || (peng.nm_vendor ? `Pembayaran kepada ${peng.nm_vendor}` : "Pengeluaran Kas");

        if (peng.rincian && peng.rincian.length > 0) {
          for (const r of peng.rincian) {
            const nominal = Number(r.total) || 0;
            if (nominal <= 0) continue;

            bkuInsertData.push({
              kd_upt: kd_upt,
              tagihan_id: peng.tagihan_id || null,
              no_bukti: peng.no_pengeluaran || "-",
              tgl_transaksi: peng.tgl_pengeluaran ? new Date(peng.tgl_pengeluaran) : new Date(),
              uraian: uraianHeader, // Mengambil uraian header pengeluaran
              debet: 0,
              kredit: nominal,
              saldo: 0,
              kd_rek6: r.kd_rek6 || peng.kd_rek6 || null,
              jenis: "bank",
              bulan: bulan,
              tahun: tahun,
              dibuat_oleh: user.id || null,
            });
          }
        } else {
          const nominal = Number(peng.nilai_pengeluaran) || 0;
          if (nominal > 0) {
            bkuInsertData.push({
              kd_upt: kd_upt,
              tagihan_id: peng.tagihan_id || null,
              no_bukti: peng.no_pengeluaran || "-",
              tgl_transaksi: peng.tgl_pengeluaran ? new Date(peng.tgl_pengeluaran) : new Date(),
              uraian: uraianHeader, // Mengambil uraian header pengeluaran
              debet: 0,
              kredit: nominal,
              saldo: 0,
              kd_rek6: peng.kd_rek6 || null,
              jenis: "bank",
              bulan: bulan,
              tahun: tahun,
              dibuat_oleh: user.id || null,
            });
          }
        }
      }

      // Urutkan data berdasarkan tanggal transaksi
      bkuInsertData.sort((a, b) => {
        const timeA = new Date(a.tgl_transaksi).getTime();
        const timeB = new Date(b.tgl_transaksi).getTime();
        return timeA - timeB;
      });

      if (bkuInsertData.length > 0) {
        await tx.bKU.createMany({
          data: bkuInsertData,
        });
      }

      return {
        totalPenerimaan: penerimaanList.length,
        totalPengeluaran: pengeluaranList.length,
        totalBkuInserted: bkuInsertData.length,
      };
    });

    return NextResponse.json({
      success: true,
      message: `Posting BKU bulan ${bulan} tahun ${tahun} berhasil. (${result.totalBkuInserted} baris transaksi diposting)`,
      data: result,
    });
  } catch (error: any) {
    console.error("Posting BKU Error:", error);
    return NextResponse.json({ error: error.message || "Gagal melakukan posting BKU" }, { status: 500 });
  }
}
