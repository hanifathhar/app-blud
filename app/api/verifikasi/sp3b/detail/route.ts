export const runtime = "nodejs";

import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

export async function GET(req: Request) {
  const user = getUserFromRequest(req as NextRequest);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const no_sp3b = searchParams.get("no_sp3b");
  const kd_upt = searchParams.get("kd_upt");

  if (!no_sp3b || !kd_upt) {
    return NextResponse.json({ error: "Parameter no_sp3b dan kd_upt diperlukan" }, { status: 400 });
  }

  try {
    const headerRows: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "trhsp3b" WHERE "no_sp3b" = $1 AND "kd_upt" = $2 LIMIT 1`,
      no_sp3b,
      kd_upt
    );

    if (!headerRows || headerRows.length === 0) {
      return NextResponse.json({ error: "Dokumen SP3B tidak ditemukan" }, { status: 404 });
    }

    const sp3b = headerRows[0];

    // Ambil UPT info
    const upt = await prisma.msUpt.findFirst({
      where: { kd_upt },
    });

    // Ambil rincian pendapatan SP3B
    const rincianPendapatan: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "trdsp3b_pendapatan" WHERE "no_sp3b" = $1 AND "kd_upt" = $2 ORDER BY "kd_rek6" ASC`,
      no_sp3b,
      kd_upt
    );

    // Ambil rincian belanja SP3B
    const rincianBelanja: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "trdsp3b_belanja" WHERE "no_sp3b" = $1 AND "kd_upt" = $2 ORDER BY "kd_sub_kegiatan" ASC, "kd_rek6" ASC`,
      no_sp3b,
      kd_upt
    );

    // Ambil data Penandatangan Kepala Dinas Kesehatan (kode: 7 / DINKES) untuk kebutuhan report SP3B
    let penandatanganKadis = await prisma.penandatangan.findFirst({
      where: {
        kode: 7,
        status: 1,
      },
      orderBy: { id: "desc" },
    });

    if (!penandatanganKadis) {
      penandatanganKadis = await prisma.penandatangan.findFirst({
        where: {
          OR: [
            { kd_upt: "DINKES", status: 1 },
            { jabatan: { contains: "Kepala Dinas", mode: "insensitive" }, status: 1 },
          ],
        },
        orderBy: { id: "desc" },
      });
    }

    // Hitung Saldo Awal berdasarkan SILPA Tahun Lalu per Sumber Dana
    const sp3bSumdan = (sp3b.sumdan || "").trim();
    const tglSp3b = sp3b.tgl_sp3b ? new Date(sp3b.tgl_sp3b) : new Date();
    const tahunSp3b = tglSp3b.getFullYear().toString();
    const bulanSp3b = Number(sp3b.bulan) || (tglSp3b.getMonth() + 1);

    let silpaRows: any[] = [];
    if (sp3bSumdan) {
      silpaRows = await prisma.$queryRawUnsafe(
        `SELECT COALESCE(SUM(nilai), 0) as total 
         FROM "tbl_silpa" 
         WHERE "kd_upt" = $1 AND "tahun" = $2 AND ("sumdan" ILIKE $3 OR $3 ILIKE '%' || "sumdan" || '%')`,
        kd_upt,
        tahunSp3b,
        sp3bSumdan
      );
    } else {
      silpaRows = await prisma.$queryRawUnsafe(
        `SELECT COALESCE(SUM(nilai), 0) as total 
         FROM "tbl_silpa" 
         WHERE "kd_upt" = $1 AND "tahun" = $2`,
        kd_upt,
        tahunSp3b
      );
    }
    const silpaAwal = Number(silpaRows[0]?.total) || 0;

    // Ambil akumulasi transaksi SP3B bulan-bulan sebelumnya pada tahun yang sama
    const prevSp3bRows: any[] = await prisma.$queryRawUnsafe(
      `SELECT COALESCE(SUM(total_pendapatan - total_belanja), 0) as prev_net
       FROM "trhsp3b"
       WHERE "kd_upt" = $1 
         AND "bulan" < $2 
         AND EXTRACT(YEAR FROM "tgl_sp3b") = $3
         AND ("no_sp3b" != $4)
         ${sp3bSumdan ? `AND ("sumdan" ILIKE '%${sp3bSumdan.replace(/'/g, "''")}%' OR '${sp3bSumdan.replace(/'/g, "''")}' ILIKE '%' || "sumdan" || '%')` : ''}`,
      kd_upt,
      bulanSp3b,
      Number(tahunSp3b),
      no_sp3b
    );
    const prevNet = Number(prevSp3bRows[0]?.prev_net) || 0;
    const saldoAwal = silpaAwal + prevNet;
    const totalPendapatan = Number(sp3b.total_pendapatan) || 0;
    const totalBelanja = Number(sp3b.total_belanja) || 0;
    const saldoAkhir = saldoAwal + totalPendapatan - totalBelanja;

    return NextResponse.json({
      success: true,
      data: {
        ...sp3b,
        nm_upt: upt?.nm_upt || sp3b.nm_upt || kd_upt,
        saldo_awal: saldoAwal,
        saldo_akhir: saldoAkhir,
        silpa_awal: silpaAwal,
        total_pendapatan: totalPendapatan,
        total_belanja: totalBelanja,
        rincianPendapatan: rincianPendapatan.map((p) => ({
          ...p,
          nilai: Number(p.nilai) || 0,
        })),
        rincianBelanja: rincianBelanja.map((b) => ({
          ...b,
          nilai: Number(b.nilai) || 0,
        })),
        upt,
        penandatanganKadis: penandatanganKadis || null,
        nm_kadis: penandatanganKadis?.nama || "dr. SRI KHAIRUNNISA, MH, MKM",
        nip_kadis: penandatanganKadis?.nip || "197112262002122008",
        pangkat_kadis: penandatanganKadis?.pangkat_golongan || "",
        jabatan_kadis: penandatanganKadis?.jabatan || "KEPALA DINAS KESEHATAN DAERAH",
      },
    });
  } catch (error: any) {
    console.error("GET SP3B Detail Error:", error);
    return NextResponse.json({ error: error.message || "Gagal memuat detail SP3B" }, { status: 500 });
  }
}
