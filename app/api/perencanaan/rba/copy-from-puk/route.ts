import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = auth;

    const body = await req.json();
    const { puk_id } = body;
    if (!puk_id) return NextResponse.json({ error: "PUK ID harus diisi" }, { status: 400 });

    const puk = await prisma.tblPuk.findUnique({
      where: { id: puk_id },
      include: { rincian: true }
    });

    if (!puk) return NextResponse.json({ error: "PUK tidak ditemukan" }, { status: 404 });

    // Cek apakah RBA untuk PUK ini sudah ada
    const existingRba = await prisma.tblRba.findFirst({
      where: { noPuk: puk.noPuk }
    });

    if (existingRba) {
      return NextResponse.json({ error: "RBA untuk PUK ini sudah ada" }, { status: 400 });
    }

    // Generate no_rba
    const no_rba = `RBA-${puk.noPuk}`;

    // Insert RBA dan Rinciannya
    const rba = await prisma.tblRba.create({
      data: {
        no_rba,
        noPuk: puk.noPuk,
        kdUkm: puk.kdUkm,
        nmUkm: puk.nmUkm,
        kdPeruntukan: puk.kdPeruntukan,
        nmPeruntukan: puk.nmPeruntukan,
        kdKomponen: puk.kdKomponen,
        nmKomponen: puk.nmKomponen,
        kdRincian: puk.kdRincian,
        nmRincian: puk.nmRincian,
        kdSubKegiatan: puk.kdSubKegiatan,
        nmSubKegiatan: puk.nmSubKegiatan,
        kdSpm: puk.kdSpm,
        nmSpm: puk.nmSpm,
        nilai: puk.nilai ?? 0,
        lokasi: puk.lokasi,
        sumdan: puk.sumdan,
        tujuan: puk.tujuan,
        sasaran: puk.sasaran,
        target_sasaran: puk.targetSasaran,
        username: payload.username,
        penanggungjawab: puk.penanggungjawab,
        tgl_update: new Date(),
        aksi: "CREATE_FROM_PUK",
        tahun: puk.tahun || payload.tahun,
        kdUnit: puk.kdUpt,
        nmUnit: puk.nmUpt,
        rincian: {
          create: puk.rincian.map(r => ({
            noPuk: puk.noPuk,
            kdUkm: puk.kdUkm,
            nmUkm: puk.nmUkm,
            kdPeruntukan: puk.kdPeruntukan,
            nmPeruntukan: puk.nmPeruntukan,
            kdKomponen: puk.kdKomponen,
            nmKomponen: puk.nmKomponen,
            kdRincian: puk.kdRincian,
            nmRincian: puk.nmRincian,
            kdSubKegiatan: puk.kdSubKegiatan,
            nmSubKegiatan: puk.nmSubKegiatan,
            kdSpm: puk.kdSpm,
            nmSpm: puk.nmSpm,
            uraian: r.uraian,
            volume: r.volume,
            satuan: r.satuan,
            nilai: r.harga,     // harga dari PUK -> nilai di RBA (harga satuan)
            total: r.total,     // total dari PUK
            username: payload.username,
            tgl_update: new Date(),
            aksi: "CREATE_FROM_PUK",
            tahun: puk.tahun || payload.tahun,
            kdUnit: puk.kdUpt,
            nmUnit: puk.nmUpt,
            sumdan: puk.sumdan
          }))
        }
      }
    });

    return NextResponse.json({ 
      message: "Berhasil membuat RBA", 
      rba: {
        ...rba,
        id: rba.id.toString()
      } 
    });
  } catch (error: any) {
    console.error("Copy RBA Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
