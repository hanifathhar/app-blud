export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const bulan = searchParams.get("bulan");
  const tahun = searchParams.get("tahun");
  const kd_upt = searchParams.get("kd_upt") || user.kd_upt;

  const bulanNum = bulan ? parseInt(bulan) : null;
  const tahunNum = tahun ? parseInt(tahun) : null;

  const where: Record<string, unknown> = {};
  if (bulanNum) where.bulan = bulanNum;
  if (tahunNum) where.tahun = tahunNum;
  if (user.role !== "superadmin") where.kd_upt = user.kd_upt;
  else if (kd_upt) where.kd_upt = kd_upt;

  // Hitung Saldo Awal Bulan Lalu (akumulasi debet - kredit sebelum bulan ini pada tahun berjalan)
  let saldoAwal = 0;
  if (bulanNum && tahunNum) {
    const prevWhere: any = {
      tahun: tahunNum,
      bulan: { lt: bulanNum },
    };
    if (user.role !== "superadmin") prevWhere.kd_upt = user.kd_upt;
    else if (kd_upt) prevWhere.kd_upt = kd_upt;

    const prevData = await prisma.bKU.findMany({
      where: prevWhere,
      select: { debet: true, kredit: true },
    });

    saldoAwal = prevData.reduce((acc, curr) => acc + (curr.debet || 0) - (curr.kredit || 0), 0);
  }

  const data = await prisma.bKU.findMany({
    where,
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

  // Fetch daftar nama rekening untuk kd_rek6 yang ada
  const allKdRek = Array.from(new Set(data.map((d) => d.kd_rek6).filter(Boolean))) as string[];
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

  // Hitung saldo kumulatif berjalan dimulai dari saldo awal
  let runningSaldo = saldoAwal;
  const withSaldo = data.map((row) => {
    runningSaldo = runningSaldo + (row.debet || 0) - (row.kredit || 0);

    // Cari nama rekening belanja dari rincian tagihan / pengeluaran atau master msRek6
    let nm_rek6 = "";
    if (row.kd_rek6) {
      nm_rek6 = mapRek6[row.kd_rek6] || "";
      if (!nm_rek6 && row.tagihan?.rincian) {
        const found = row.tagihan.rincian.find((r) => r.kd_rek6 === row.kd_rek6);
        if (found) nm_rek6 = found.nm_rek6 || "";
      }
      if (!nm_rek6 && row.tagihan?.pengeluaran?.rincian) {
        const found = row.tagihan.pengeluaran.rincian.find((r) => r.kd_rek6 === row.kd_rek6);
        if (found) nm_rek6 = found.nm_rek6 || "";
      }
    }

    return {
      ...row,
      nm_rek6,
      saldo: runningSaldo,
    };
  });

  // Rekap bulan ini
  const totalDebet = data.reduce((s, r) => s + (r.debet || 0), 0);
  const totalKredit = data.reduce((s, r) => s + (r.kredit || 0), 0);
  const saldoAkhir = runningSaldo;

  return NextResponse.json({
    data: withSaldo,
    saldoAwal,
    totalDebet,
    totalKredit,
    saldoAkhir,
  });
}

export async function POST(req: Request) {
  const user = getUserFromRequest(req);
  if (!user || !["superadmin", "bendahara"].includes(user.role))
    return NextResponse.json({ error: "Forbidden - Hanya Bendahara yang dapat input BKU" }, { status: 403 });

  const body = await req.json();
  const kd_upt = user.role === "superadmin" ? body.kd_upt : user.kd_upt;

  const tgl = body.tgl_transaksi ? new Date(body.tgl_transaksi) : new Date();
  const bulan = tgl.getMonth() + 1;
  const tahun = tgl.getFullYear();

  try {
    let bku;

    if (body.tagihan_id) {
      // Jika dari Tagihan, gunakan transaksi untuk insert BKU, update Tagihan, dan insert Pengeluaran
      const tagihanId = parseInt(body.tagihan_id);
      
      const tagihan = await prisma.tagihan.findUnique({
        where: { id: tagihanId },
        include: { rincian: true },
      });

      if (!tagihan) {
        return NextResponse.json({ error: "Tagihan tidak ditemukan" }, { status: 404 });
      }

      await prisma.$transaction(async (tx) => {
        bku = await tx.bKU.create({
          data: {
            kd_upt: kd_upt || "",
            tagihan_id: tagihanId,
            no_bukti: body.no_bukti,
            tgl_transaksi: tgl,
            uraian: body.uraian,
            debet: body.debet ? parseFloat(body.debet) : 0,
            kredit: body.kredit ? parseFloat(body.kredit) : 0,
            kd_rek6: body.kd_rek6,
            jenis: body.jenis || "kas",
            bulan,
            tahun,
            dibuat_oleh: user.id,
          },
        });

        // Update status tagihan
        await tx.tagihan.update({
          where: { id: tagihanId },
          data: { status: "lunas" },
        });

        // Generate nomor pengeluaran
        const countPengeluaran = await tx.pengeluaran.count();
        const no_pengeluaran = `PENG/${tahun}/${String(countPengeluaran + 1).padStart(4, '0')}`;

        // Buat Pengeluaran
        const pengeluaran = await tx.pengeluaran.create({
          data: {
            tagihan_id: tagihanId,
            no_pengeluaran,
            tahun: tagihan.tahun,
            kd_upt: tagihan.kd_upt,
            nm_upt: tagihan.nm_upt,
            tgl_pengeluaran: tgl,
            nilai_pengeluaran: tagihan.nilai_tagihan,
            keterangan: body.uraian || tagihan.keterangan,
            nm_vendor: tagihan.nm_vendor,
            kd_ukm: tagihan.kd_ukm,
            nm_ukm: tagihan.nm_ukm,
            kd_peruntukan: tagihan.kd_peruntukan,
            nm_peruntukan: tagihan.nm_peruntukan,
            kd_komponen: tagihan.kd_komponen,
            nm_komponen: tagihan.nm_komponen,
            kd_rincian: tagihan.kd_rincian,
            nm_rincian: tagihan.nm_rincian,
            kd_sub_kegiatan: tagihan.kd_sub_kegiatan,
            nm_sub_kegiatan: tagihan.nm_sub_kegiatan,
            kd_spm: tagihan.kd_spm,
            nm_spm: tagihan.nm_spm,
            kd_rek6: body.kd_rek6 || tagihan.kd_rek6,
            nm_rek6: tagihan.nm_rek6,
            sumdan: tagihan.sumdan,
            nm_sumdan: tagihan.nm_sumdan,
          },
        });

        // Buat Rincian Pengeluaran
        if (tagihan.rincian && tagihan.rincian.length > 0) {
          const rincianData = tagihan.rincian.map(r => ({
            pengeluaran_id: pengeluaran.id,
            kd_rek6: r.kd_rek6,
            nm_rek6: r.nm_rek6,
            uraian: r.uraian,
            kd_ukm: r.kd_ukm,
            nm_ukm: r.nm_ukm,
            kd_peruntukan: r.kd_peruntukan,
            nm_peruntukan: r.nm_peruntukan,
            kd_komponen: r.kd_komponen,
            nm_komponen: r.nm_komponen,
            kd_rincian: r.kd_rincian,
            nm_rincian: r.nm_rincian,
            kd_sub_kegiatan: r.kd_sub_kegiatan,
            nm_sub_kegiatan: r.nm_sub_kegiatan,
            kd_spm: r.kd_spm,
            nm_spm: r.nm_spm,
            volume: r.volume,
            satuan: r.satuan,
            harga: r.harga,
            total: r.total,
            sumdan: r.sumdan,
            nm_sumdan: r.nm_sumdan,
          }));

          await tx.rincianPengeluaran.createMany({
            data: rincianData,
          });
        }
      });
    } else {
      bku = await prisma.bKU.create({
        data: {
          kd_upt: kd_upt || "",
          sp2d_id: body.sp2d_id ? parseInt(body.sp2d_id) : null,
          no_bukti: body.no_bukti,
          tgl_transaksi: tgl,
          uraian: body.uraian,
          debet: body.debet ? parseFloat(body.debet) : 0,
          kredit: body.kredit ? parseFloat(body.kredit) : 0,
          kd_rek6: body.kd_rek6,
          jenis: body.jenis || "kas",
          bulan,
          tahun,
          dibuat_oleh: user.id,
        },
      });
    }

    return NextResponse.json({ data: bku }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating BKU:", error);
    return NextResponse.json({ error: error.message || "Gagal menyimpan BKU" }, { status: 500 });
  }
}
