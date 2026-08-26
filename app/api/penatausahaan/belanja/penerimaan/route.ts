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
    if (status) whereClause.status = status;
    
    let pengadaanFilter: any = {};
    if (tahun) pengadaanFilter.tahun = tahun;
    if (auth.level !== 1 && kd_upt) pengadaanFilter.kd_upt = kd_upt;
    
    // Khusus admin bisa filter by UPT
    const param_kd_upt = url.searchParams.get("kd_upt");
    if (auth.level === 1 && param_kd_upt) {
      pengadaanFilter.kd_upt = param_kd_upt;
    }
    
    if (Object.keys(pengadaanFilter).length > 0) {
      whereClause.AND = whereClause.AND || [];
      whereClause.AND.push({ pengadaan: pengadaanFilter });
    }

    if (search) {
      whereClause.AND = whereClause.AND || [];
      whereClause.AND.push({
        OR: [
          { no_bast: { contains: search, mode: "insensitive" } },
          { keterangan: { contains: search, mode: "insensitive" } },
          { pengadaan: { nm_vendor: { contains: search, mode: "insensitive" } } }
        ]
      });
    }

    const unused_tagihan = url.searchParams.get("unused_tagihan");
    if (unused_tagihan === "true") {
      whereClause.tagihan = { none: {} };
    }

    const [total, penerimaanData] = await prisma.$transaction([
      prisma.penerimaanBarang.count({ where: whereClause }),
      prisma.penerimaanBarang.findMany({
        where: whereClause,
        include: {
          pengadaan: {
            include: { 
              rincian: true,
              permintaan_belanja: {
                include: {
                  tagihan: true
                }
              }
            }
          },
          tagihan: true,
        },
        orderBy: {
          tgl_dibuat: "desc",
        },
        skip,
        take: limit,
      })
    ]);

    const penerimaanList = penerimaanData.map((item: any) => ({
      ...item,
      nm_vendor: item.pengadaan?.nm_vendor,
      uraian: item.keterangan,
      nilai_bast: item.pengadaan?.nilai_kontrak,
      rincian: item.pengadaan?.rincian || [],
    }));

    return NextResponse.json({ 
      data: penerimaanList,
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
      pengadaan_id,
      no_bast,
      tgl_bast,
      nm_vendor,
      uraian,
      nilai_bast,
      tahun,
      rincian,
    } = body;

    const kd_upt = auth.unit;

    if (!no_bast || !tgl_bast || !rincian || rincian.length === 0) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }
    
    let p_kd_upt = null;
    let p_nm_upt = null;
    if (pengadaan_id) {
      const p = await prisma.pengadaan.findUnique({ where: { id: Number(pengadaan_id) } });
      if (p) {
        p_kd_upt = p.kd_upt;
        p_nm_upt = p.nm_upt;
      }
    }

    const penerimaan = await prisma.$transaction(async (tx) => {
      const pb = await tx.penerimaanBarang.create({
        data: {
          pengadaan_id: Number(pengadaan_id),
          kd_upt: p_kd_upt,
          nm_upt: p_nm_upt,
          no_bast,
          tgl_bast: new Date(tgl_bast),
          keterangan: uraian,
          status: "diterima",
        }
      });

      if (pengadaan_id) {
         const p = await tx.pengadaan.update({
           where: { id: Number(pengadaan_id) },
           data: { status: "selesai" }
         });

         if (p.permintaan_belanja_id) {
           await tx.permintaanBelanja.update({
             where: { id: p.permintaan_belanja_id },
             data: { status: "diterima" }
           });
         }
      }

      return pb;
    });

    return NextResponse.json({ 
      message: "Data Penerimaan Barang berhasil dibuat", 
      data: penerimaan 
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Nomor BAST sudah ada" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
