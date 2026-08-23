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
    if (tahun) whereClause.tahun = tahun;
    if (auth.level !== 1 && kd_upt) {
      whereClause.kd_upt = kd_upt;
    }
    if (status) whereClause.status = status;

    const tagihanList = await prisma.tagihan.findMany({
      where: whereClause,
      include: {
        penerimaan_barang: true,
      },
      orderBy: {
        tgl_dibuat: "desc",
      },
    });

    return NextResponse.json({ data: tagihanList });
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

    if (!no_tagihan || !tgl_tagihan || !penerimaan_id) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    const tagihan = await prisma.tagihan.create({
      data: {
        penerimaan_barang_id: Number(penerimaan_id),
        no_tagihan,
        tgl_tagihan: new Date(tgl_tagihan),
        nilai_tagihan: Number(nilai_tagihan || 0),
        keterangan: uraian,
        status: "belum_dibayar",
      },
    });

    return NextResponse.json({ 
      message: "Data Tagihan berhasil dibuat", 
      data: tagihan 
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Nomor Tagihan sudah ada" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
