export const runtime = "nodejs";

import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

// GET: Ambil daftar SP3B / daftar LPJ yang belum dibuatkan SP3B
export async function GET(req: Request) {
  const user = getUserFromRequest(req as NextRequest);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isDinkes = user.role === "superadmin" || user.level === 1 || user.role === "keuangan" || user.role === "kpa";
  if (!isDinkes) {
    return NextResponse.json({ error: "Forbidden - Menu SP3B hanya dapat diakses oleh Administrator dan Dinas Kesehatan" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode"); // "eligible_lpj" atau list sp3b biasa
  const kd_upt = searchParams.get("kd_upt") || "";
  const tahunParam = searchParams.get("tahun");
  const bulanParam = searchParams.get("bulan");
  const now = new Date();
  const tahun = tahunParam ? parseInt(tahunParam) : now.getFullYear();
  const tahunStr = tahun.toString();
  const q = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  try {
    // Mode 1: Ambil daftar LPJ yang eligible untuk dibuatkan SP3B (belum pernah di-SP3B)
    if (mode === "eligible_lpj") {
      let lpjWhere = `WHERE "tahun" = '${tahunStr}' AND "status" = 'disahkan'`;
      if (kd_upt) {
        lpjWhere += ` AND "kd_upt" = '${kd_upt}'`;
      }
      if (bulanParam) {
        lpjWhere += ` AND "bulan" = ${parseInt(bulanParam)}`;
      }

      // Ambil daftar nomor LPJ yang sudah pernah dibuatkan SP3B
      const existingSp3bRows: any[] = await prisma.$queryRawUnsafe(
        `SELECT "no_lpj", "kd_upt" FROM "trhsp3b" WHERE "no_lpj" IS NOT NULL`
      );
      const usedLpjSet = new Set(existingSp3bRows.map((r: any) => `${r.kd_upt}:::${r.no_lpj}`));

      const lpjRows: any[] = await prisma.$queryRawUnsafe(
        `SELECT id, no_lpj, tahun, bulan, kd_upt, nm_upt, sumdan, nm_sumdan, tgl_lpj, total_pendapatan, total_belanja, keterangan, disahkan_oleh, tgl_disahkan
         FROM "tbl_lpj"
         ${lpjWhere}
         ORDER BY "bulan" DESC, "nm_upt" ASC`
      );

      const eligibleLpj = (lpjRows || [])
        .filter((l: any) => !usedLpjSet.has(`${l.kd_upt}:::${l.no_lpj}`))
        .map((l: any) => ({
          ...l,
          total_pendapatan: Number(l.total_pendapatan) || 0,
          total_belanja: Number(l.total_belanja) || 0,
          id: Number(l.id) || l.id,
        }));

      // Hitung next running number untuk SP3B pada UPT dan Tahun ini
      let maxUrut = 0;
      if (kd_upt) {
        const sp3bCountRows: any[] = await prisma.$queryRawUnsafe(
          `SELECT "no_sp3b" FROM "trhsp3b" WHERE "kd_upt" = $1 ORDER BY "no_sp3b" DESC`,
          kd_upt
        );

        if (sp3bCountRows && sp3bCountRows.length > 0) {
          for (const row of sp3bCountRows) {
            const match = String(row.no_sp3b).match(/^(\d+)/);
            if (match) {
              const num = parseInt(match[1]);
              if (num > maxUrut) maxUrut = num;
            }
          }
        }
      }

      const nextUrut = String(maxUrut + 1).padStart(5, "0");
      const nextNoSp3b = `${nextUrut}/${kd_upt || "BLUD"}/SP3B/${tahunStr}`;

      return NextResponse.json({
        success: true,
        data: eligibleLpj,
        next_no_sp3b: nextNoSp3b,
      });
    }

    // Mode 2: Ambil riwayat daftar SP3B
    let queryWhere = `WHERE 1=1`;
    if (kd_upt) {
      queryWhere += ` AND h."kd_upt" = '${kd_upt}'`;
    }
    if (bulanParam) {
      queryWhere += ` AND h."bulan" = ${parseInt(bulanParam)}`;
    }
    if (q) {
      const cleanQ = q.replace(/'/g, "''");
      queryWhere += ` AND (h."no_sp3b" ILIKE '%${cleanQ}%' OR h."nm_upt" ILIKE '%${cleanQ}%' OR h."no_lpj" ILIKE '%${cleanQ}%' OR h."ket" ILIKE '%${cleanQ}%')`;
    }

    const countRows: any[] = await prisma.$queryRawUnsafe(
      `SELECT count(*)::int as count FROM "trhsp3b" h ${queryWhere}`
    );
    const total = countRows && countRows[0] ? Number(countRows[0].count) : 0;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;

    const listRows: any[] = await prisma.$queryRawUnsafe(
      `SELECT h."no_sp3b", h."tgl_sp3b", h."ket", h."username", h."tgl_update", h."kd_upt", h."nm_upt",
              h."total_pendapatan", h."total_belanja", h."sumdan", h."bulan", h."no_lpj", h."status", h."verif"
       FROM "trhsp3b" h
       ${queryWhere}
       ORDER BY h."tgl_sp3b" DESC, h."no_sp3b" DESC
       LIMIT ${limit} OFFSET ${offset}`
    );

    return NextResponse.json({
      success: true,
      data: listRows || [],
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error: any) {
    console.error("GET SP3B Error:", error);
    return NextResponse.json({ error: error.message || "Gagal memuat data SP3B" }, { status: 500 });
  }
}

// POST: Terbitkan Dokumen SP3B Baru Berdasarkan No LPJ
export async function POST(req: Request) {
  const user = getUserFromRequest(req as NextRequest);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isDinkes = user.role === "superadmin" || user.level === 1 || user.role === "keuangan" || user.role === "kpa";
  if (!isDinkes) {
    return NextResponse.json({ error: "Forbidden - Hanya Dinas Kesehatan / Super Admin yang dapat membuat SP3B" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      no_sp3b,
      tgl_sp3b,
      kd_upt,
      no_lpj,
      ket,
    } = body;

    if (!no_sp3b || !kd_upt || !no_lpj) {
      return NextResponse.json({ error: "No SP3B, Unit Kerja (kd_upt), dan No LPJ wajib diisi" }, { status: 400 });
    }

    const tglSp3bDate = tgl_sp3b ? new Date(tgl_sp3b) : new Date();

    // 1. Cek apakah SP3B dengan nomor ini sudah pernah ada pada UPT
    const existingSp3b: any[] = await prisma.$queryRawUnsafe(
      `SELECT "no_sp3b" FROM "trhsp3b" WHERE "no_sp3b" = $1 AND "kd_upt" = $2 LIMIT 1`,
      no_sp3b,
      kd_upt
    );
    if (existingSp3b && existingSp3b.length > 0) {
      return NextResponse.json({ error: `Nomor SP3B ${no_sp3b} sudah pernah diterbitkan untuk UPT ini` }, { status: 400 });
    }

    // 2. Ambil dokumen LPJ referensi dan rinciannya
    const lpjRows: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "tbl_lpj" WHERE "kd_upt" = $1 AND "no_lpj" = $2 LIMIT 1`,
      kd_upt,
      no_lpj
    );
    if (!lpjRows || lpjRows.length === 0) {
      return NextResponse.json({ error: `Dokumen LPJ ${no_lpj} tidak ditemukan` }, { status: 404 });
    }
    const lpj = lpjRows[0];

    // Ambil rincian LPJ
    const rincianLpj: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "tbl_rincian_lpj" WHERE "lpj_id" = $1 ORDER BY "id" ASC`,
      lpj.id
    );

    // Ambil info nama UPT
    const upt = await prisma.msUpt.findFirst({
      where: { kd_upt },
    });
    const nm_upt = upt?.nm_upt || lpj.nm_upt || kd_upt;

    const rincianPendapatan = rincianLpj.filter((r: any) => r.jenis === "pendapatan");
    const rincianBelanja = rincianLpj.filter((r: any) => r.jenis === "belanja");

    const totalPendapatan = Number(lpj.total_pendapatan) || rincianPendapatan.reduce((s: number, r: any) => s + Number(r.jumlah || 0), 0);
    const totalBelanja = Number(lpj.total_belanja) || rincianBelanja.reduce((s: number, r: any) => s + Number(r.jumlah || 0), 0);

    // 3. Simpan ke database via transaksi atomic
    const result = await prisma.$transaction(async (tx) => {
      // a. Insert Header trhsp3b
      await tx.$executeRawUnsafe(
        `INSERT INTO "trhsp3b" ("no_sp3b", "tgl_sp3b", "ket", "username", "tgl_update", "kd_upt", "nm_upt", "total_pendapatan", "total_belanja", "sumdan", "bulan", "no_lpj", "status", "verif")
         VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, $8, $9, $10, $11, 1, 1)`,
        no_sp3b,
        tglSp3bDate,
        ket || `SP3B Bulan ${lpj.bulan} Tahun ${lpj.tahun} (${no_lpj})`,
        user.nama || user.username,
        kd_upt,
        nm_upt,
        totalPendapatan,
        totalBelanja,
        lpj.sumdan || null,
        lpj.bulan ? parseInt(lpj.bulan) : null,
        no_lpj
      );

      // b. Insert Rincian Pendapatan (trdsp3b_pendapatan)
      for (const p of rincianPendapatan) {
        const subKeg = p.kd_sub_kegiatan || "0.00.00.0.00.00";
        const rek6 = p.kd_rek6 || "4.1.04.16.01";
        await tx.$executeRawUnsafe(
          `INSERT INTO "trdsp3b_pendapatan" ("no_sp3b", "tgl_sp3b", "kd_upt", "nm_upt", "kd_sub_kegiatan", "nm_sub_kegiatan", "kd_rek6", "nm_rek6", "nilai")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT ("no_sp3b", "kd_upt", "kd_sub_kegiatan", "kd_rek6") DO UPDATE 
           SET "nilai" = "trdsp3b_pendapatan"."nilai" + EXCLUDED."nilai"`,
          no_sp3b,
          tglSp3bDate,
          kd_upt,
          nm_upt,
          subKeg,
          p.nm_sub_kegiatan || null,
          rek6,
          p.nm_rek6 || null,
          Number(p.jumlah) || 0
        );
      }

      // c. Insert Rincian Belanja (trdsp3b_belanja)
      for (const b of rincianBelanja) {
        const subKeg = b.kd_sub_kegiatan || "0.00.00.0.00.00";
        const rek6 = b.kd_rek6 || "5.1.02.99.99";
        await tx.$executeRawUnsafe(
          `INSERT INTO "trdsp3b_belanja" ("no_sp3b", "tgl_sp3b", "kd_upt", "nm_upt", "kd_sub_kegiatan", "nm_sub_kegiatan", "kd_rek6", "nm_rek6", "nilai")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT ("no_sp3b", "kd_upt", "kd_sub_kegiatan", "kd_rek6") DO UPDATE 
           SET "nilai" = "trdsp3b_belanja"."nilai" + EXCLUDED."nilai"`,
          no_sp3b,
          tglSp3bDate,
          kd_upt,
          nm_upt,
          subKeg,
          b.nm_sub_kegiatan || null,
          rek6,
          b.nm_rek6 || null,
          Number(b.jumlah) || 0
        );
      }

      return { no_sp3b, kd_upt, no_lpj };
    });

    return NextResponse.json({
      success: true,
      message: `Dokumen SP3B ${no_sp3b} berhasil diterbitkan dari LPJ ${no_lpj}.`,
      data: result,
    });
  } catch (error: any) {
    console.error("POST SP3B Error:", error);
    return NextResponse.json({ error: error.message || "Gagal menerbitkan SP3B" }, { status: 500 });
  }
}

// DELETE: Batalkan / Hapus Dokumen SP3B
export async function DELETE(req: Request) {
  const user = getUserFromRequest(req as NextRequest);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isDinkes = user.role === "superadmin" || user.level === 1 || user.role === "keuangan";
  if (!isDinkes) {
    return NextResponse.json({ error: "Forbidden - Hanya Dinas Kesehatan / Super Admin yang dapat membatalkan SP3B" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const no_sp3b = searchParams.get("no_sp3b");
  const kd_upt = searchParams.get("kd_upt");

  if (!no_sp3b || !kd_upt) {
    return NextResponse.json({ error: "Parameter no_sp3b dan kd_upt diperlukan" }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Hapus rincian pendapatan & belanja
      await tx.$executeRawUnsafe(
        `DELETE FROM "trdsp3b_pendapatan" WHERE "no_sp3b" = $1 AND "kd_upt" = $2`,
        no_sp3b,
        kd_upt
      );
      await tx.$executeRawUnsafe(
        `DELETE FROM "trdsp3b_belanja" WHERE "no_sp3b" = $1 AND "kd_upt" = $2`,
        no_sp3b,
        kd_upt
      );
      // Hapus header
      await tx.$executeRawUnsafe(
        `DELETE FROM "trhsp3b" WHERE "no_sp3b" = $1 AND "kd_upt" = $2`,
        no_sp3b,
        kd_upt
      );
    });

    return NextResponse.json({
      success: true,
      message: `Dokumen SP3B ${no_sp3b} berhasil dibatalkan. Kunci LPJ terkait telah dibuka kembali.`,
    });
  } catch (error: any) {
    console.error("DELETE SP3B Error:", error);
    return NextResponse.json({ error: error.message || "Gagal membatalkan SP3B" }, { status: 500 });
  }
}
