import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const noPuk = searchParams.get("noPuk");

    if (!noPuk) {
      return NextResponse.json({ error: "noPuk is required" }, { status: 400 });
    }

    const data = await prisma.tblPukRincian.findMany({
      where: { noPuk },
      orderBy: { id: "asc" }
    });

    return NextResponse.json({ data });
  } catch (err: any) {
    console.error("GET rincian error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    // Pastikan PUK induk ada
    const puk = await prisma.tblPuk.findUnique({
      where: { noPuk: body.noPuk }
    });

    if (!puk) {
      return NextResponse.json({ error: "Data PUK Induk tidak ditemukan" }, { status: 404 });
    }

    const { 
      uraian, volume, satuan, harga,
      jan, feb, mar, apr, mei, jun, jul, agus, sep, okt, nov, des
    } = body;

    const j = Number(jan || 0); const f = Number(feb || 0); const m = Number(mar || 0);
    const a = Number(apr || 0); const me = Number(mei || 0); const ju = Number(jun || 0);
    const jl = Number(jul || 0); const ag = Number(agus || 0); const s = Number(sep || 0);
    const o = Number(okt || 0); const n = Number(nov || 0); const d = Number(des || 0);

    const volumeNum = Number(volume || 0);
    const hargaNum = Number(harga || 0);
    const total = volumeNum * hargaNum;

    // Buat record baru di TblPukRincian, warisi data parent jika diperlukan
    const newRincian = await prisma.tblPukRincian.create({
      data: {
        noPuk: puk.noPuk,
        kdUnit: puk.kdUpt, nmUnit: puk.nmUpt,
        kdUkm: puk.kdUkm, nmUkm: puk.nmUkm,
        kdPeruntukan: puk.kdPeruntukan, nmPeruntukan: puk.nmPeruntukan,
        kdKomponen: puk.kdKomponen, nmKomponen: puk.nmKomponen,
        kdRincian: puk.kdRincian, nmRincian: puk.nmRincian,
        kdSubKegiatan: puk.kdSubKegiatan, nmSubKegiatan: puk.nmSubKegiatan,
        kdSpm: puk.kdSpm, nmSpm: puk.nmSpm,
        tujuan: puk.tujuan, sasaran: puk.sasaran,
        targetSasaran: puk.targetSasaran, targetObjek: puk.targetObjek,
        penanggungjawab: puk.penanggungjawab,
        lokasi: puk.lokasi, sumdan: puk.sumdan, tahun: puk.tahun as string,
        username: auth.username,
        tglUpdate: new Date(),
        aksi: "Create",
        
        uraian, 
        volume: volumeNum, 
        satuan: satuan || null,
        harga: hargaNum, 
        total,
        jan: j, feb: f, mar: m, apr: a, mei: me, jun: ju, 
        jul: jl, agus: ag, sep: s, okt: o, nov: n, des: d
      }
    });

    // Update parent (TblPuk) dengan mengakumulasi nilainya
    const allRincian = await prisma.tblPukRincian.findMany({ where: { noPuk: puk.noPuk } });
    
    await prisma.tblPuk.update({
      where: { noPuk: puk.noPuk as string },
      data: {
        jan: allRincian.reduce((acc, r) => acc + Number(r.jan || 0), 0),
        feb: allRincian.reduce((acc, r) => acc + Number(r.feb || 0), 0),
        mar: allRincian.reduce((acc, r) => acc + Number(r.mar || 0), 0),
        apr: allRincian.reduce((acc, r) => acc + Number(r.apr || 0), 0),
        mei: allRincian.reduce((acc, r) => acc + Number(r.mei || 0), 0),
        jun: allRincian.reduce((acc, r) => acc + Number(r.jun || 0), 0),
        jul: allRincian.reduce((acc, r) => acc + Number(r.jul || 0), 0),
        agus: allRincian.reduce((acc, r) => acc + Number(r.agus || 0), 0),
        sep: allRincian.reduce((acc, r) => acc + Number(r.sep || 0), 0),
        okt: allRincian.reduce((acc, r) => acc + Number(r.okt || 0), 0),
        nov: allRincian.reduce((acc, r) => acc + Number(r.nov || 0), 0),
        des: allRincian.reduce((acc, r) => acc + Number(r.des || 0), 0),
        nilai: allRincian.reduce((acc, r) => acc + Number(r.total || 0), 0),
      }
    });

    return NextResponse.json({ message: "Created", data: newRincian }, { status: 201 });
  } catch (err: any) {
    console.error("POST rincian error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

