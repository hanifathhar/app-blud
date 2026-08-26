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
    const status = url.searchParams.get("status");

    const search = url.searchParams.get("search");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    let whereClause: any = {};
    if (tahun) whereClause.tahun = tahun;
    if (status) whereClause.status = status;

    let uptFilters: any[] = [];
    if (auth.level !== 1 && kd_upt) {
      uptFilters.push({ permintaan_belanja: { kd_upt: kd_upt } });
      uptFilters.push({ penerimaan_barang: { pengadaan: { kd_upt: kd_upt } } });
    }
    
    // Khusus admin bisa filter by UPT
    const param_kd_upt = url.searchParams.get("kd_upt");
    if (auth.level === 1 && param_kd_upt) {
      uptFilters.push({ permintaan_belanja: { kd_upt: param_kd_upt } });
      uptFilters.push({ penerimaan_barang: { pengadaan: { kd_upt: param_kd_upt } } });
    }

    if (uptFilters.length > 0) {
      whereClause.AND = whereClause.AND || [];
      whereClause.AND.push({ OR: uptFilters });
    }

    if (search) {
      whereClause.AND = whereClause.AND || [];
      whereClause.AND.push({
        OR: [
          { no_tagihan: { contains: search, mode: "insensitive" } },
          { keterangan: { contains: search, mode: "insensitive" } },
          { penerimaan_barang: { pengadaan: { nm_vendor: { contains: search, mode: "insensitive" } } } },
          { permintaan_belanja: { nm_ukm: { contains: search, mode: "insensitive" } } }
        ]
      });
    }

    const [total, tagihanList] = await prisma.$transaction([
      prisma.tagihan.count({ where: whereClause }),
      prisma.tagihan.findMany({
        where: whereClause,
        include: {
          penerimaan_barang: { include: { pengadaan: true } },
          permintaan_belanja: true,
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
      data: tagihanList,
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
      penerimaan_id,
      permintaan_id,
      no_tagihan,
      tgl_tagihan,
      nm_vendor,
      uraian,
      nilai_tagihan,
      mekanisme,
      sumdan,
      tahun,
    } = body;

    const kd_upt = auth.unit;

    if (!no_tagihan || !tgl_tagihan || (!penerimaan_id && !permintaan_id)) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    let parentData: any = {};
    let rincianData: any[] = [];
    let permintaan_id_from_pengadaan: number | null = null;
    
    if (permintaan_id) {
      const p = await prisma.permintaanBelanja.findUnique({
        where: { id: Number(permintaan_id) },
        include: { rincian: true }
      });
      if (p) {
        parentData = p;
        rincianData = p.rincian || [];
      }
    } else if (penerimaan_id) {
      const bast = await prisma.penerimaanBarang.findUnique({
        where: { id: Number(penerimaan_id) },
        include: { 
          pengadaan: { 
            include: { 
              rincian: true,
              permintaan_belanja: true 
            } 
          } 
        }
      });
      if (bast && bast.pengadaan) {
        parentData = bast.pengadaan.permintaan_belanja || bast.pengadaan;
        rincianData = bast.pengadaan.rincian || [];
        permintaan_id_from_pengadaan = bast.pengadaan.permintaan_belanja_id || null;
      }
    }
    let t_kd_upt = parentData?.kd_upt || auth.unit || "";
    let t_nm_upt = null;
    if (t_kd_upt) {
      if (parentData?.nm_upt) {
        t_nm_upt = parentData.nm_upt;
      } else {
        const upt = await prisma.msUpt.findFirst({ where: { kd_upt: t_kd_upt } });
        if (upt) t_nm_upt = upt.nm_upt;
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const createdTagihan = await tx.tagihan.create({
        data: {
          penerimaan_barang_id: penerimaan_id ? Number(penerimaan_id) : undefined,
          permintaan_belanja_id: permintaan_id ? Number(permintaan_id) : undefined,
          no_tagihan,
          no_permintaan: parentData?.no_permintaan || null,
          tahun: parentData?.tahun || new Date().getFullYear().toString(),
          kd_upt: t_kd_upt,
          nm_upt: t_nm_upt,
          tgl_tagihan: new Date(tgl_tagihan),
          nilai_tagihan: Number(nilai_tagihan || 0),
          keterangan: uraian,
          nm_vendor: nm_vendor || null,
          status: "belum_dibayar",

          kd_ukm: parentData?.kd_ukm,
          nm_ukm: parentData?.nm_ukm,
          kd_peruntukan: parentData?.kd_peruntukan,
          nm_peruntukan: parentData?.nm_peruntukan,
          kd_komponen: parentData?.kd_komponen,
          nm_komponen: parentData?.nm_komponen,
          kd_rincian: parentData?.kd_rincian,
          nm_rincian: parentData?.nm_rincian,
          kd_sub_kegiatan: parentData?.kd_sub_kegiatan,
          nm_sub_kegiatan: parentData?.nm_sub_kegiatan,
          kd_spm: parentData?.kd_spm,
          nm_spm: parentData?.nm_spm,
          
          kd_rek6: rincianData.length > 0 ? rincianData[0].kd_rek6 : undefined,
          nm_rek6: rincianData.length > 0 ? rincianData[0].nm_rek6 : undefined,
          sumdan: rincianData.length > 0 ? rincianData[0].sumdan : undefined,
          nm_sumdan: rincianData.length > 0 ? rincianData[0].nm_sumdan : undefined,

          rincian: rincianData.length > 0 ? {
            create: rincianData.map(r => ({
              kd_rek6: r.kd_rek6,
              nm_rek6: r.nm_rek6,
              uraian: r.uraian,
              
              kd_ukm: r.kd_ukm || parentData?.kd_ukm,
              nm_ukm: r.nm_ukm || parentData?.nm_ukm,
              kd_peruntukan: r.kd_peruntukan || parentData?.kd_peruntukan,
              nm_peruntukan: r.nm_peruntukan || parentData?.nm_peruntukan,
              kd_komponen: r.kd_komponen || parentData?.kd_komponen,
              nm_komponen: r.nm_komponen || parentData?.nm_komponen,
              kd_rincian: r.kd_rincian || parentData?.kd_rincian,
              nm_rincian: r.nm_rincian || parentData?.nm_rincian,
              kd_sub_kegiatan: r.kd_sub_kegiatan || parentData?.kd_sub_kegiatan,
              nm_sub_kegiatan: r.nm_sub_kegiatan || parentData?.nm_sub_kegiatan,
              kd_spm: r.kd_spm || parentData?.kd_spm,
              nm_spm: r.nm_spm || parentData?.nm_spm,

              volume: r.volume,
              satuan: r.satuan,
              harga: r.harga,
              total: r.total,
              sumdan: r.sumdan,
              nm_sumdan: r.nm_sumdan,
            }))
          } : undefined
        }
      });

      if (permintaan_id) {
        await tx.permintaanBelanja.update({
          where: { id: Number(permintaan_id) },
          data: { status: "tagihan" }
        });
      }
      
      if (permintaan_id_from_pengadaan) {
        await tx.permintaanBelanja.update({
          where: { id: permintaan_id_from_pengadaan },
          data: { status: "tagihan" }
        });
      }

      return createdTagihan;
    });

    return NextResponse.json({ 
      message: "Data Tagihan berhasil dibuat", 
      data: result 
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Nomor Tagihan sudah ada" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
