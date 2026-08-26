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

    const param_kd_upt = url.searchParams.get("kd_upt");
    let whereClause: any = {};
    if (tahun) whereClause.tahun = tahun;
    
    if (auth.level === 1) {
      if (param_kd_upt) whereClause.kd_upt = param_kd_upt;
    } else {
      if (kd_upt) whereClause.kd_upt = kd_upt;
    }
    if (status) whereClause.status = status;
    
    if (search) {
      whereClause.OR = [
        { no_kontrak: { contains: search, mode: "insensitive" } },
        { nm_vendor: { contains: search, mode: "insensitive" } },
        { uraian: { contains: search, mode: "insensitive" } },
      ];
    }

    const [total, pengadaanList] = await prisma.$transaction([
      prisma.pengadaan.count({ where: whereClause }),
      prisma.pengadaan.findMany({
        where: whereClause,
        include: {
          rincian: true,
          permintaan_belanja: true,
        },
        orderBy: {
          tgl_dibuat: "desc",
        },
        skip,
        take: limit,
      })
    ]);

    return NextResponse.json({ 
      data: pengadaanList,
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
      permintaan_belanja_id,
      no_kontrak,
      tgl_kontrak,
      nm_vendor,
      alamat_vendor,
      uraian,
      nilai_kontrak,
      tahun,
      rincian,
      no_permintaan,
      kd_ukm,
      nm_ukm,
      kd_peruntukan,
      nm_peruntukan,
      kd_komponen,
      nm_komponen,
      kd_rincian,
      nm_rincian,
      kd_sub_kegiatan,
      nm_sub_kegiatan,
      kd_spm,
      nm_spm,
    } = body;

    let kd_upt = auth.unit || "";
    if (body.kd_upt) {
      kd_upt = body.kd_upt;
    }

    if (permintaan_belanja_id) {
      const pb = await prisma.permintaanBelanja.findUnique({
        where: { id: Number(permintaan_belanja_id) }
      });
      if (pb && pb.kd_upt) {
        kd_upt = pb.kd_upt;
      }
    }

    let nm_upt = null;
    if (kd_upt) {
      const upt = await prisma.msUpt.findFirst({ where: { kd_upt } });
      if (upt) nm_upt = upt.nm_upt;
    }

    if (!no_kontrak || !tgl_kontrak || !rincian || rincian.length === 0) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const pengadaan = await prisma.$transaction(async (tx) => {
      const p = await tx.pengadaan.create({
        data: {
          permintaan_belanja_id: permintaan_belanja_id ? Number(permintaan_belanja_id) : null,
          no_kontrak,
          tgl_kontrak: new Date(tgl_kontrak),
          kd_upt: kd_upt,
          nm_upt: nm_upt,
          tahun,
          nm_vendor,
          alamat_vendor,
          uraian,
          nilai_kontrak: Number(nilai_kontrak || 0),
          no_permintaan,
          kd_ukm,
          nm_ukm,
          kd_peruntukan,
          nm_peruntukan,
          kd_komponen,
          nm_komponen,
          kd_rincian,
          nm_rincian,
          kd_sub_kegiatan,
          nm_sub_kegiatan,
          kd_spm,
          nm_spm,
          status: "proses",
          dibuat_oleh: auth.username,
          rincian: {
            create: rincian.map((r: any) => ({
              kd_rek6: r.kd_rek6,
              nm_rek6: r.nm_rek6,
              uraian: r.uraian,
              kd_ukm: r.kd_ukm || kd_ukm,
              nm_ukm: r.nm_ukm || nm_ukm,
              kd_peruntukan: r.kd_peruntukan || kd_peruntukan,
              nm_peruntukan: r.nm_peruntukan || nm_peruntukan,
              kd_komponen: r.kd_komponen || kd_komponen,
              nm_komponen: r.nm_komponen || nm_komponen,
              kd_rincian: r.kd_rincian || kd_rincian,
              nm_rincian: r.nm_rincian || nm_rincian,
              kd_sub_kegiatan: r.kd_sub_kegiatan || kd_sub_kegiatan,
              nm_sub_kegiatan: r.nm_sub_kegiatan || nm_sub_kegiatan,
              kd_spm: r.kd_spm || kd_spm,
              nm_spm: r.nm_spm || nm_spm,
              volume: Number(r.volume || 0),
              satuan: r.satuan,
              harga: Number(r.harga || 0),
              total: Number(r.total || (Number(r.volume || 0) * Number(r.harga || 0))),
              sumdan: r.sumdan,
              nm_sumdan: r.nm_sumdan,
            })),
          },
        },
        include: {
          rincian: true,
        },
      });

      if (permintaan_belanja_id) {
         await tx.permintaanBelanja.update({
           where: { id: Number(permintaan_belanja_id) },
           data: { status: "diproses_pengadaan" }
         });
      }

      return p;
    });

    return NextResponse.json({ 
      message: "Data Pengadaan berhasil dibuat", 
      data: pengadaan 
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Nomor kontrak sudah ada" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
