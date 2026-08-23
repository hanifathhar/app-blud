import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const tahun = url.searchParams.get("tahun");
    const kd_upt = url.searchParams.get("kd_upt") || auth.unit;
    const status = url.searchParams.get("status");

    let whereClause: any = {};
    if (status) whereClause.status = status;
    
    let permintaanFilter: any = {};
    if (tahun) permintaanFilter.tahun = tahun;
    if (auth.level !== 1 && kd_upt) permintaanFilter.kd_upt = kd_upt;
    
    if (Object.keys(permintaanFilter).length > 0) {
      whereClause.pengadaan = {
        permintaan_belanja: permintaanFilter
      };
    }

    const penerimaanData = await prisma.penerimaanBarang.findMany({
      where: whereClause,
      include: {
        pengadaan: true,
      },
      orderBy: {
        tgl_dibuat: "desc",
      },
    });

    const penerimaanList = penerimaanData.map((item: any) => ({
      ...item,
      nm_vendor: item.pengadaan?.nm_vendor,
      uraian: item.keterangan,
      nilai_bast: item.pengadaan?.nilai_kontrak,
    }));

    return NextResponse.json({ data: penerimaanList });
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

    const penerimaan = await prisma.$transaction(async (tx) => {
      const pb = await tx.penerimaanBarang.create({
        data: {
          pengadaan_id: Number(pengadaan_id),
          no_bast,
          tgl_bast: new Date(tgl_bast),
          keterangan: uraian,
          status: "diterima",
        }
      });

      if (pengadaan_id) {
         await tx.pengadaan.update({
           where: { id: Number(pengadaan_id) },
           data: { status: "selesai" }
         });
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
