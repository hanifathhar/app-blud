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
  const sumdanFilter = searchParams.get("sumdan") || "";

  const isSuperAdmin = user.role === "superadmin" || user.level === 1;
  const kd_upt = searchParams.get("kd_upt") || (!isSuperAdmin ? (user.kd_upt || user.unit || "") : "");

  try {
    // 1. Ambil info UPT jika kd_upt ada
    let upt = null;
    let penandatanganKpa = null;
    if (kd_upt) {
      upt = await prisma.msUpt.findFirst({
        where: { kd_upt },
      });

      penandatanganKpa = await prisma.penandatangan.findFirst({
        where: {
          kd_upt,
          kode: 1,
          status: 1,
        },
        orderBy: { id: "desc" },
      });
    }

    // 3. Rentang Tanggal Bulan Terkait
    const startDate = new Date(tahun, bulan - 1, 1);
    const endDate = new Date(tahun, bulan, 1);

    const q = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // 4. Cek apakah sudah ada LPJ tersimpan di database
    let existingLpj: any = null;
    let publishedLpjList: any[] = [];
    let totalPublished = 0;
    let totalPages = 1;

    try {
      if (kd_upt) {
        const rows: any[] = await prisma.$queryRawUnsafe(
          `SELECT * FROM "tbl_lpj" WHERE "kd_upt" = $1 AND "tahun" = $2 AND "bulan" = $3 ${sumdanFilter ? 'AND "sumdan" = $4' : ''} LIMIT 1`,
          ...(sumdanFilter ? [kd_upt, tahunStr, bulan, sumdanFilter] : [kd_upt, tahunStr, bulan])
        );
        if (rows && rows.length > 0) {
          existingLpj = rows[0];
          const rincianRows: any[] = await prisma.$queryRawUnsafe(
            `SELECT * FROM "tbl_rincian_lpj" WHERE "lpj_id" = $1 ORDER BY "id" ASC`,
            existingLpj.id
          );
          existingLpj.rincian = rincianRows;
        }
      }

      // Ambil daftar seluruh LPJ yang telah diterbitkan pada unit (atau semua unit) & tahun ini
      let queryWhere = `WHERE "tahun" = '${tahunStr}'`;
      if (kd_upt) {
        queryWhere += ` AND "kd_upt" = '${kd_upt}'`;
      }
      if (q) {
        const cleanQ = q.replace(/'/g, "''");
        queryWhere += ` AND ("no_lpj" ILIKE '%${cleanQ}%' OR "nm_upt" ILIKE '%${cleanQ}%' OR "keterangan" ILIKE '%${cleanQ}%' OR "sumdan" ILIKE '%${cleanQ}%')`;
      }

      const countRows: any[] = await prisma.$queryRawUnsafe(
        `SELECT count(*)::int as count FROM "tbl_lpj" ${queryWhere}`
      );
      totalPublished = countRows && countRows[0] ? Number(countRows[0].count) : 0;
      totalPages = Math.ceil(totalPublished / limit) || 1;
      const offset = (page - 1) * limit;

      const listRows: any[] = await prisma.$queryRawUnsafe(
        `SELECT id, no_lpj, tahun, bulan, kd_upt, nm_upt, sumdan, nm_sumdan, tgl_lpj, total_pendapatan, total_belanja, status, disahkan_oleh, tgl_disahkan, keterangan, created_at
         FROM "tbl_lpj"
         ${queryWhere}
         ORDER BY "nm_upt" ASC, "tahun" DESC, "bulan" ASC, "no_lpj" ASC
         LIMIT ${limit} OFFSET ${offset}`
      );
      publishedLpjList = listRows || [];
    } catch (e) {
      console.warn("Table tbl_lpj not accessible yet via raw query:", e);
    }

    if (!kd_upt) {
      return NextResponse.json({
        success: true,
        lpj: null,
        isDisahkan: false,
        rincianPendapatan: [],
        rincianBelanja: [],
        totalPendapatan: 0,
        totalBelanja: 0,
        sumberDanaList: ["Dana kapitasi JKN", "BLUD", "BOK"],
        publishedLpjList,
        pagination: {
          total: totalPublished,
          page,
          limit,
          totalPages,
        },
        upt: null,
        penandatanganKpa: null,
      });
    }

    // Ambil daftar sumber dana yang ada pada transaksi penerimaan dan pengeluaran bulan ini
    const rawPenerimaan = await prisma.tblPenerimaan.findMany({
      where: {
        kdUnit: kd_upt,
        tglBukti: { gte: startDate, lt: endDate },
      },
      select: { sumdan: true, kdRek6: true, nmRek6: true, nilai: true, keterangan: true },
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

    const sumdanSet = new Set<string>();
    rawPenerimaan.forEach((p) => {
      if (p.sumdan && p.sumdan.trim()) sumdanSet.add(p.sumdan.trim());
    });
    rawPengeluaran.forEach((peng) => {
      if (peng.sumdan && peng.sumdan.trim()) sumdanSet.add(peng.sumdan.trim());
      if (peng.rincian) {
        peng.rincian.forEach((r) => {
          if (r.sumdan && r.sumdan.trim()) sumdanSet.add(r.sumdan.trim());
          if (r.nm_sumdan && r.nm_sumdan.trim()) sumdanSet.add(r.nm_sumdan.trim());
        });
      }
    });

    // Jika belum ada di transaksi, defaultkan ke Dana kapitasi JKN atau data dari master ms_dana
    if (sumdanSet.size === 0) {
      sumdanSet.add("Dana kapitasi JKN");
      const masterDana = await prisma.msDana.findMany({ take: 5 });
      masterDana.forEach((d) => {
        if (d.sumdan) sumdanSet.add(d.sumdan);
      });
    }

    const sumberDanaList = Array.from(sumdanSet);

    // Jika sudah ada LPJ yang disahkan dan datanya diminta
    if (existingLpj && existingLpj.status === "disahkan") {
      const rincianPendapatan = (existingLpj.rincian || [])
        .filter((r: any) => r.jenis === "pendapatan")
        .map((r: any) => ({
          kd_rek6: r.kd_rek6 || "-",
          nm_rek6: r.nm_rek6 || "-",
          sumdan: r.sumdan || existingLpj.sumdan || "-",
          jumlah: Number(r.jumlah) || 0,
        }));

      const rincianBelanja = (existingLpj.rincian || [])
        .filter((r: any) => r.jenis === "belanja")
        .map((r: any) => ({
          kd_sub_kegiatan: r.kd_sub_kegiatan || "",
          nm_sub_kegiatan: r.nm_sub_kegiatan || "",
          kd_rek6: r.kd_rek6 || "",
          nm_rek6: r.nm_rek6 || "-",
          sumdan: r.sumdan || existingLpj.sumdan || "-",
          full_kd_rek: r.kd_sub_kegiatan && r.kd_rek6 ? `${r.kd_sub_kegiatan}.${r.kd_rek6}` : (r.kd_rek6 || r.kd_sub_kegiatan || "-"),
          jumlah: Number(r.jumlah) || 0,
        }));

      return NextResponse.json({
        success: true,
        lpj: existingLpj,
        isDisahkan: true,
        rincianPendapatan,
        rincianBelanja,
        totalPendapatan: Number(existingLpj.total_pendapatan) || 0,
        totalBelanja: Number(existingLpj.total_belanja) || 0,
        sumberDanaList,
        publishedLpjList,
        pagination: {
          total: totalPublished,
          page,
          limit,
          totalPages,
        },
        upt,
        penandatanganKpa,
      });
    }

    // Jika belum disahkan (Draft / Realtime Agregasi)
    // A. Agregasi Pendapatan
    const pendapatanMap: Record<string, { kd_rek6: string; nm_rek6: string; sumdan: string; jumlah: number }> = {};
    rawPenerimaan.forEach((p) => {
      const sDan = p.sumdan || "Dana kapitasi JKN";
      if (sumdanFilter && !sDan.toLowerCase().includes(sumdanFilter.toLowerCase()) && !sumdanFilter.toLowerCase().includes(sDan.toLowerCase())) {
        return;
      }

      const key = p.kdRek6 || "lainnya";
      if (!pendapatanMap[key]) {
        pendapatanMap[key] = {
          kd_rek6: p.kdRek6 || "-",
          nm_rek6: p.nmRek6 || p.keterangan || "-",
          sumdan: sDan,
          jumlah: 0,
        };
      }
      pendapatanMap[key].jumlah += Number(p.nilai) || 0;
    });

    // B. Agregasi Belanja
    const belanjaMap: Record<string, { kd_sub_kegiatan: string; nm_sub_kegiatan: string; kd_rek6: string; nm_rek6: string; sumdan: string; full_kd_rek: string; jumlah: number }> = {};
    rawPengeluaran.forEach((peng) => {
      if (peng.rincian && peng.rincian.length > 0) {
        peng.rincian.forEach((r) => {
          const sDan = r.sumdan || r.nm_sumdan || peng.sumdan || peng.nm_sumdan || "Dana kapitasi JKN";
          if (sumdanFilter && !sDan.toLowerCase().includes(sumdanFilter.toLowerCase()) && !sumdanFilter.toLowerCase().includes(sDan.toLowerCase())) {
            return;
          }

          const kd_sub = r.kd_sub_kegiatan || peng.kd_sub_kegiatan || "";
          const kd_rek = r.kd_rek6 || peng.kd_rek6 || "";
          const fullKey = `${kd_sub}.${kd_rek}`;

          if (!belanjaMap[fullKey]) {
            belanjaMap[fullKey] = {
              kd_sub_kegiatan: kd_sub,
              nm_sub_kegiatan: r.nm_sub_kegiatan || peng.nm_sub_kegiatan || "-",
              kd_rek6: kd_rek,
              nm_rek6: r.nm_rek6 || peng.nm_rek6 || "-",
              sumdan: sDan,
              full_kd_rek: kd_sub && kd_rek ? `${kd_sub}.${kd_rek}` : (kd_rek || kd_sub || "-"),
              jumlah: 0,
            };
          }
          belanjaMap[fullKey].jumlah += Number(r.total) || (Number(r.volume) * Number(r.harga)) || 0;
        });
      } else {
        const sDan = peng.sumdan || peng.nm_sumdan || "Dana kapitasi JKN";
        if (sumdanFilter && !sDan.toLowerCase().includes(sumdanFilter.toLowerCase()) && !sumdanFilter.toLowerCase().includes(sDan.toLowerCase())) {
          return;
        }

        const kd_sub = peng.kd_sub_kegiatan || "";
        const kd_rek = peng.kd_rek6 || "";
        const fullKey = `${kd_sub}.${kd_rek}`;

        if (!belanjaMap[fullKey]) {
          belanjaMap[fullKey] = {
            kd_sub_kegiatan: kd_sub,
            nm_sub_kegiatan: peng.nm_sub_kegiatan || "-",
            kd_rek6: kd_rek,
            nm_rek6: peng.nm_rek6 || "-",
            sumdan: sDan,
            full_kd_rek: kd_sub && kd_rek ? `${kd_sub}.${kd_rek}` : (kd_rek || kd_sub || "-"),
            jumlah: 0,
          };
        }
        belanjaMap[fullKey].jumlah += Number(peng.nilai_pengeluaran) || 0;
      }
    });

    const rincianPendapatan = Object.values(pendapatanMap);
    const rincianBelanja = Object.values(belanjaMap);
    const totalPendapatan = rincianPendapatan.reduce((s, r) => s + r.jumlah, 0);
    const totalBelanja = rincianBelanja.reduce((s, r) => s + r.jumlah, 0);

    return NextResponse.json({
      success: true,
      lpj: existingLpj || null,
      isDisahkan: false,
      rincianPendapatan,
      rincianBelanja,
      totalPendapatan,
      totalBelanja,
      sumberDanaList,
      publishedLpjList,
      pagination: {
        total: totalPublished,
        page,
        limit,
        totalPages,
      },
      upt,
      penandatanganKpa,
    });
  } catch (error: any) {
    console.error("GET LPJ Error:", error);
    return NextResponse.json({ error: error.message || "Gagal memuat data LPJ" }, { status: 500 });
  }
}

// POST: Pengesahan LPJ Bulanan
export async function POST(req: Request) {
  const user = getUserFromRequest(req);
  if (!user || (!["superadmin", "keuangan", "kpa"].includes(user.role) && user.level !== 1)) {
    return NextResponse.json({ error: "Forbidden - Hanya Subag Keuangan / Superadmin yang dapat mengesahkan LPJ" }, { status: 403 });
  }

  const body = await req.json();
  const { bulan, tahun, kd_upt, sumdan, no_lpj: customNoLpj, tgl_lpj: customTglLpj, keterangan } = body;

  if (!bulan || !tahun || !kd_upt) {
    return NextResponse.json({ error: "Bulan, Tahun, dan Unit UPT wajib diisi" }, { status: 400 });
  }

  const bulanNum = parseInt(bulan);
  const tahunStr = tahun.toString();
  const activeSumdan = sumdan || "Dana kapitasi JKN";

  try {
    // 0. Validasi: Cek apakah LPJ untuk UPT, Tahun, Bulan, dan Sumber Dana ini sudah pernah disahkan
    const { force } = body;
    const existingLpjRows: any[] = await prisma.$queryRawUnsafe(
      `SELECT id, no_lpj, tgl_disahkan, disahkan_oleh FROM "tbl_lpj" WHERE "kd_upt" = $1 AND "tahun" = $2 AND "bulan" = $3 AND "sumdan" = $4 LIMIT 1`,
      kd_upt,
      tahunStr,
      bulanNum,
      activeSumdan
    );

    if (existingLpjRows && existingLpjRows.length > 0 && !force) {
      const existing = existingLpjRows[0];
      return NextResponse.json({
        error: `LPJ untuk periode ${bulanNum}/${tahunStr} (${activeSumdan}) sudah pernah disahkan dengan Nomor: ${existing.no_lpj} oleh ${existing.disahkan_oleh || 'Petugas'}. Batalkan terlebih dahulu pengesahan sebelumnya jika ingin mengesahkan ulang.`,
        alreadyExists: true,
        existingLpj: existing
      }, { status: 400 });
    }

    const upt = await prisma.msUpt.findFirst({ where: { kd_upt } });
    const nm_upt = upt?.nm_upt || "";

    // 1. Generate nomor otomatis SPTJ jika tidak diinput manual: nomor urut dihitung per UPT dan Tahun Periode
    let no_lpj = customNoLpj && customNoLpj.trim() ? customNoLpj.trim() : "";
    if (!no_lpj) {
      const countRows: any[] = await prisma.$queryRawUnsafe(
        `SELECT count(*)::int as count FROM "tbl_lpj" WHERE "kd_upt" = $1 AND "tahun" = $2`,
        kd_upt,
        tahunStr
      );
      const countLpj = countRows && countRows[0] ? Number(countRows[0].count) : 0;
      const nextNoUrut = String(countLpj + 1).padStart(5, "0");
      no_lpj = `${nextNoUrut}/${kd_upt}/SPTJ/${tahunStr}`;
    }

    // Jika nomor yang dimasukkan ternyata sudah dipakai di record lain pada UPT dan Tahun yang sama
    const checkNoDuplicate: any[] = await prisma.$queryRawUnsafe(
      `SELECT id, kd_upt, bulan, tahun, sumdan FROM "tbl_lpj" WHERE "no_lpj" = $1 AND NOT ("kd_upt" = $2 AND "tahun" = $3 AND "bulan" = $4 AND "sumdan" = $5) LIMIT 1`,
      no_lpj,
      kd_upt,
      tahunStr,
      bulanNum,
      activeSumdan
    );

    if (checkNoDuplicate && checkNoDuplicate.length > 0) {
      const countTotal: any[] = await prisma.$queryRawUnsafe(
        `SELECT count(*)::int as count FROM "tbl_lpj" WHERE "kd_upt" = $1 AND "tahun" = $2`,
        kd_upt,
        tahunStr
      );
      const nextUrutNumber = (countTotal && countTotal[0] ? Number(countTotal[0].count) : 0) + 1;
      return NextResponse.json({
        error: `Nomor Dokumen '${no_lpj}' sudah digunakan oleh pengesahan lain pada unit ini. Silakan gunakan nomor lain (Contoh: ${String(nextUrutNumber).padStart(5, "0")}/${kd_upt}/SPTJ/${tahunStr}).`
      }, { status: 400 });
    }

    const tglLpjDate = customTglLpj ? new Date(customTglLpj) : new Date();

    // 2. Ambil rincian pendapatan & belanja
    const startDate = new Date(parseInt(tahunStr), bulanNum - 1, 1);
    const endDate = new Date(parseInt(tahunStr), bulanNum, 1);

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

    // Map rincian pendapatan
    const rincianPendapatanData: any[] = [];
    rawPenerimaan.forEach((p) => {
      const sDan = p.sumdan || "Dana kapitasi JKN";
      if (activeSumdan && !sDan.toLowerCase().includes(activeSumdan.toLowerCase()) && !activeSumdan.toLowerCase().includes(sDan.toLowerCase())) {
        return;
      }
      rincianPendapatanData.push({
        jenis: "pendapatan",
        kd_sub_kegiatan: null,
        nm_sub_kegiatan: null,
        kd_rek6: p.kdRek6 || null,
        nm_rek6: p.nmRek6 || p.keterangan || null,
        sumdan: sDan,
        nm_sumdan: sDan,
        jumlah: Number(p.nilai) || 0,
        keterangan: p.keterangan || null,
      });
    });

    // Map rincian belanja
    const rincianBelanjaData: any[] = [];
    rawPengeluaran.forEach((peng) => {
      if (peng.rincian && peng.rincian.length > 0) {
        peng.rincian.forEach((r) => {
          const sDan = r.sumdan || r.nm_sumdan || peng.sumdan || peng.nm_sumdan || "Dana kapitasi JKN";
          if (activeSumdan && !sDan.toLowerCase().includes(activeSumdan.toLowerCase()) && !activeSumdan.toLowerCase().includes(sDan.toLowerCase())) {
            return;
          }
          rincianBelanjaData.push({
            jenis: "belanja",
            kd_sub_kegiatan: r.kd_sub_kegiatan || peng.kd_sub_kegiatan || null,
            nm_sub_kegiatan: r.nm_sub_kegiatan || peng.nm_sub_kegiatan || null,
            kd_rek6: r.kd_rek6 || peng.kd_rek6 || null,
            nm_rek6: r.nm_rek6 || peng.nm_rek6 || null,
            sumdan: sDan,
            nm_sumdan: sDan,
            jumlah: Number(r.total) || (Number(r.volume) * Number(r.harga)) || 0,
            keterangan: r.uraian || peng.keterangan || null,
          });
        });
      } else {
        const sDan = peng.sumdan || peng.nm_sumdan || "Dana kapitasi JKN";
        if (activeSumdan && !sDan.toLowerCase().includes(activeSumdan.toLowerCase()) && !activeSumdan.toLowerCase().includes(sDan.toLowerCase())) {
          return;
        }
        rincianBelanjaData.push({
          jenis: "belanja",
          kd_sub_kegiatan: peng.kd_sub_kegiatan || null,
          nm_sub_kegiatan: peng.nm_sub_kegiatan || null,
          kd_rek6: peng.kd_rek6 || null,
          nm_rek6: peng.nm_rek6 || null,
          sumdan: sDan,
          nm_sumdan: sDan,
          jumlah: Number(peng.nilai_pengeluaran) || 0,
          keterangan: peng.keterangan || null,
        });
      }
    });

    const totalPendapatan = rincianPendapatanData.reduce((s, r) => s + r.jumlah, 0);
    const totalBelanja = rincianBelanjaData.reduce((s, r) => s + r.jumlah, 0);

    // 3. Simpan Transaksi LPJ dan Kunci Data
    const result = await prisma.$transaction(async (tx) => {
      // Hapus LPJ lama jika ada untuk kombinasi ini
      await tx.$executeRawUnsafe(
        `DELETE FROM "tbl_lpj" WHERE "kd_upt" = $1 AND "tahun" = $2 AND "bulan" = $3 AND "sumdan" = $4`,
        kd_upt,
        tahunStr,
        bulanNum,
        activeSumdan
      );

      // Insert record LPJ baru
      const insertLpjRows: any[] = await tx.$queryRawUnsafe(
        `INSERT INTO "tbl_lpj" ("no_lpj", "tahun", "bulan", "kd_upt", "nm_upt", "sumdan", "nm_sumdan", "tgl_lpj", "total_pendapatan", "total_belanja", "status", "disahkan_oleh", "tgl_disahkan", "keterangan", "created_at", "updated_at")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'disahkan', $11, NOW(), $12, NOW(), NOW())
         RETURNING *`,
        no_lpj,
        tahunStr,
        bulanNum,
        kd_upt,
        nm_upt,
        activeSumdan,
        activeSumdan,
        tglLpjDate,
        totalPendapatan,
        totalBelanja,
        user.nama || user.username,
        keterangan || `Pengesahan LPJ Bulan ${bulanNum} Tahun ${tahunStr}`
      );
      const lpjCreated = insertLpjRows[0];

      // Insert Rincian
      const allRincian = [...rincianPendapatanData, ...rincianBelanjaData];
      for (const item of allRincian) {
        await tx.$executeRawUnsafe(
          `INSERT INTO "tbl_rincian_lpj" ("lpj_id", "jenis", "kd_sub_kegiatan", "nm_sub_kegiatan", "kd_rek6", "nm_rek6", "sumdan", "nm_sumdan", "jumlah", "keterangan")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          lpjCreated.id,
          item.jenis,
          item.kd_sub_kegiatan || null,
          item.nm_sub_kegiatan || null,
          item.kd_rek6 || null,
          item.nm_rek6 || null,
          item.sumdan || null,
          item.nm_sumdan || null,
          item.jumlah || 0,
          item.keterangan || null
        );
      }

      // Kunci data penerimaan sesuai UPT, bulan, dan sumber dana: pengesahan = 1, verif = 1
      const wherePenerimaan: any = {
        kdUnit: kd_upt,
        tglBukti: { gte: startDate, lt: endDate },
      };
      if (activeSumdan) {
        wherePenerimaan.sumdan = { contains: activeSumdan, mode: "insensitive" };
      }

      await tx.tblPenerimaan.updateMany({
        where: wherePenerimaan,
        data: {
          pengesahan: 1,
          verif: 1,
          userVerif: user.nama || user.username,
          tglVerif: new Date(),
        },
      });

      // Kunci data pengeluaran sesuai UPT, bulan, dan sumber dana: pengesahan = 1, verif = 1
      const wherePengeluaran: any = {
        kd_upt,
        tgl_pengeluaran: { gte: startDate, lt: endDate },
      };
      if (activeSumdan) {
        wherePengeluaran.OR = [
          { sumdan: { contains: activeSumdan, mode: "insensitive" } },
          { nm_sumdan: { contains: activeSumdan, mode: "insensitive" } },
          {
            rincian: {
              some: {
                OR: [
                  { sumdan: { contains: activeSumdan, mode: "insensitive" } },
                  { nm_sumdan: { contains: activeSumdan, mode: "insensitive" } },
                ]
              }
            }
          }
        ];
      }

      await tx.pengeluaran.updateMany({
        where: wherePengeluaran,
        data: {
          pengesahan: 1,
          verif: 1,
          user_verif: user.nama || user.username,
          tgl_verif: new Date(),
        },
      });

      return lpjCreated;
    });

    return NextResponse.json({
      success: true,
      message: `LPJ ${no_lpj} berhasil disahkan. Seluruh transaksi periode ini telah terkunci.`,
      data: result,
    });
  } catch (error: any) {
    console.error("POST LPJ Error:", error);
    return NextResponse.json({ error: error.message || "Gagal mengesahkan LPJ" }, { status: 500 });
  }
}

// DELETE: Batalkan Pengesahan LPJ (Buka Kunci Transaksi)
export async function DELETE(req: Request) {
  const user = getUserFromRequest(req);
  if (!user || (!["superadmin", "keuangan"].includes(user.role) && user.level !== 1)) {
    return NextResponse.json({ error: "Forbidden - Hanya Subag Keuangan / Superadmin yang dapat membatalkan LPJ" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const bulan = parseInt(searchParams.get("bulan") || "0");
  const tahun = searchParams.get("tahun") || "";
  const kd_upt = searchParams.get("kd_upt") || "";
  const sumdan = searchParams.get("sumdan") || "";

  if (!bulan || !tahun || !kd_upt) {
    return NextResponse.json({ error: "Parameter bulan, tahun, dan kd_upt diperlukan" }, { status: 400 });
  }

  try {
    const startDate = new Date(parseInt(tahun), bulan - 1, 1);
    const endDate = new Date(parseInt(tahun), bulan, 1);

    await prisma.$transaction(async (tx) => {
      // Hapus / batalkan record LPJ
      if (sumdan) {
        await tx.$executeRawUnsafe(
          `DELETE FROM "tbl_lpj" WHERE "kd_upt" = $1 AND "tahun" = $2 AND "bulan" = $3 AND "sumdan" = $4`,
          kd_upt,
          tahun,
          bulan,
          sumdan
        );
      } else {
        await tx.$executeRawUnsafe(
          `DELETE FROM "tbl_lpj" WHERE "kd_upt" = $1 AND "tahun" = $2 AND "bulan" = $3`,
          kd_upt,
          tahun,
          bulan
        );
      }

      // Buka kunci penerimaan sesuai sumdan
      const wherePenerimaan: any = {
        kdUnit: kd_upt,
        tglBukti: { gte: startDate, lt: endDate },
      };
      if (sumdan) {
        wherePenerimaan.sumdan = { contains: sumdan, mode: "insensitive" };
      }

      await tx.tblPenerimaan.updateMany({
        where: wherePenerimaan,
        data: {
          pengesahan: 0,
        },
      });

      // Buka kunci pengeluaran sesuai sumdan
      const wherePengeluaran: any = {
        kd_upt,
        tgl_pengeluaran: { gte: startDate, lt: endDate },
      };
      if (sumdan) {
        wherePengeluaran.OR = [
          { sumdan: { contains: sumdan, mode: "insensitive" } },
          { nm_sumdan: { contains: sumdan, mode: "insensitive" } },
          {
            rincian: {
              some: {
                OR: [
                  { sumdan: { contains: sumdan, mode: "insensitive" } },
                  { nm_sumdan: { contains: sumdan, mode: "insensitive" } },
                ]
              }
            }
          }
        ];
      }

      await tx.pengeluaran.updateMany({
        where: wherePengeluaran,
        data: {
          pengesahan: 0,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Pengesahan LPJ berhasil dibatalkan. Kunci transaksi periode ini telah dibuka kembali.`,
    });
  } catch (error: any) {
    console.error("DELETE LPJ Error:", error);
    return NextResponse.json({ error: error.message || "Gagal membatalkan LPJ" }, { status: 500 });
  }
}
