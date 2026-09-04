import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const tahun = url.searchParams.get("tahun") || auth.tahun;
    const kd_upt = url.searchParams.get("kd_upt") || auth.unit;

    const search = url.searchParams.get("search");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    let whereClause: any = {};
    if (tahun) whereClause.tahun = tahun;

    let uptFilters: any[] = [];
    if (auth.level !== 1 && kd_upt) {
      uptFilters.push({ kd_upt: kd_upt });
    }
    
    // Khusus admin bisa filter by UPT
    const param_kd_upt = url.searchParams.get("kd_upt");
    if (auth.level === 1 && param_kd_upt) {
      uptFilters.push({ kd_upt: param_kd_upt });
    }

    if (uptFilters.length > 0) {
      whereClause.AND = whereClause.AND || [];
      whereClause.AND.push({ OR: uptFilters });
    }

    if (search) {
      whereClause.AND = whereClause.AND || [];
      whereClause.AND.push({
        OR: [
          { no_pengeluaran: { contains: search, mode: "insensitive" } },
          { keterangan: { contains: search, mode: "insensitive" } },
          { nm_vendor: { contains: search, mode: "insensitive" } }
        ]
      });
    }

    const [total, list] = await prisma.$transaction([
      prisma.pengeluaran.count({ where: whereClause }),
      prisma.pengeluaran.findMany({
        where: whereClause,
        include: {
          tagihan: true,
          rincian: true,
        },
        orderBy: {
          tgl_dibuat: "desc",
        },
        skip,
        take: limit,
      })
    ]);

    return NextResponse.json({ 
      data: list,
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      tagihan_id,
      tgl_pengeluaran,
      keterangan,
    } = body;

    if (!tagihan_id || !tgl_pengeluaran) {
      return NextResponse.json({ error: "Data tidak lengkap (tagihan_id, tgl_pengeluaran wajib diisi)" }, { status: 400 });
    }

    const tagihanIdNum = Number(tagihan_id);
    const tagihan = await prisma.tagihan.findUnique({
      where: { id: tagihanIdNum },
      include: { rincian: true },
    });

    if (!tagihan) {
      return NextResponse.json({ error: "Tagihan tidak ditemukan" }, { status: 404 });
    }
    if (tagihan.status === "lunas") {
      return NextResponse.json({ error: "Tagihan sudah lunas / dibukukan" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Generate nomor pengeluaran
      const tahun = tagihan.tahun || new Date().getFullYear().toString();
      const countPengeluaran = await tx.pengeluaran.count({
        where: { tahun }
      });
      const no_pengeluaran = `PENG/${tahun}/${String(countPengeluaran + 1).padStart(4, '0')}`;

      // Buat Pengeluaran
      const pengeluaran = await tx.pengeluaran.create({
        data: {
          tagihan_id: tagihanIdNum,
          no_pengeluaran,
          tahun: tagihan.tahun,
          kd_upt: tagihan.kd_upt,
          nm_upt: tagihan.nm_upt,
          tgl_pengeluaran: new Date(tgl_pengeluaran),
          nilai_pengeluaran: tagihan.nilai_tagihan,
          keterangan: keterangan || tagihan.keterangan,
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
          kd_rek6: tagihan.kd_rek6,
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

      // Update status tagihan
      await tx.tagihan.update({
        where: { id: tagihanIdNum },
        data: { status: "lunas" },
      });

      return pengeluaran;
    });

    return NextResponse.json({ 
      message: "Tagihan berhasil dibukukan", 
      data: result 
    }, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Nomor Pengeluaran atau Tagihan sudah ada" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
