import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: no_rba } = await params;
    const rba = await prisma.tblRba.findUnique({
      where: { no_rba },
      include: {
        rincian: { orderBy: { id: "asc" } }
      }
    });

    if (!rba) return NextResponse.json({ error: "RBA tidak ditemukan" }, { status: 404 });

    let nmProgram = "";
    let kdProgram = "";
    let nmKegiatan = "";
    let kdKegiatan = "";

    if (rba.kdSubKegiatan) {
      const subGiat = await prisma.mSubGiat.findFirst({
        where: { kd_sub_kegiatan: rba.kdSubKegiatan }
      });
      if (subGiat) {
        kdProgram = (subGiat.kd_program || "").trim();
        kdKegiatan = (subGiat.kd_kegiatan || "").trim();

        if (kdProgram) {
          const prog = await prisma.mProg.findFirst({ where: { kd_program: kdProgram } });
          if (prog) nmProgram = prog.nm_program || "";
        }
        if (kdKegiatan) {
          const giat = await prisma.mGiat.findFirst({ where: { kd_kegiatan: kdKegiatan } });
          if (giat) nmKegiatan = giat.nm_kegiatan || "";
        }
      }
    }

    // Handle BigInt serialization
    const data = {
      ...rba,
      kdProgram,
      nmProgram,
      kdKegiatan,
      nmKegiatan,
      id: rba.id.toString(),
      rincian: rba.rincian.map(r => ({
        ...r,
        id: r.id.toString()
      }))
    };

    return NextResponse.json({ data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = auth;

    const { id: no_rba } = await params;
    const body = await req.json();
    const { rincian_id, volume, harga, kd_rek6, nm_rek6 } = body;

    if (!rincian_id) return NextResponse.json({ error: "Rincian ID wajib" }, { status: 400 });

    const rincianRba = await prisma.tblRbaRincian.findUnique({ where: { id: rincian_id } });
    if (!rincianRba) return NextResponse.json({ error: "Rincian RBA tidak ditemukan" }, { status: 404 });

    // Validasi terhadap PUK
    // Cari TblPukRincian aslinya
    const originalPukRincian = await prisma.tblPukRincian.findFirst({
      where: {
        noPuk: rincianRba.noPuk,
        uraian: rincianRba.uraian,
        kdSubKegiatan: rincianRba.kdSubKegiatan
      }
    });

    if (originalPukRincian) {
      const pTotal = Number(originalPukRincian.total || 0);
      const newTotal = Number(volume || 0) * Number(harga || 0);

      if (newTotal > pTotal) {
        return NextResponse.json({ error: `Total RBA (Rp ${new Intl.NumberFormat('id-ID').format(newTotal)}) tidak boleh melebihi Total PUK (Rp ${new Intl.NumberFormat('id-ID').format(pTotal)})` }, { status: 400 });
      }
    }

    // Update rincian RBA
    const updatedRincian = await prisma.tblRbaRincian.update({
      where: { id: rincian_id },
      data: {
        volume,
        nilai: harga,
        total: Number(volume || 0) * Number(harga || 0),
        kd_rek6,
        nm_rek6,
        tgl_update: new Date(),
        username: payload.username
      }
    });

    // Update parent RBA (recalculate total)
    const allRincian = await prisma.tblRbaRincian.findMany({ where: { no_rba } });
    const grandTotal = allRincian.reduce((sum, r) => sum + Number(r.total || 0), 0);

    await prisma.tblRba.update({
      where: { no_rba },
      data: { nilai: grandTotal, tgl_update: new Date(), username: payload.username }
    });

    return NextResponse.json({
      message: "Rincian RBA berhasil diperbarui",
      data: {
        ...updatedRincian,
        id: updatedRincian.id.toString()
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = getUserFromRequest(req);
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const { id: no_rba } = resolvedParams;

    const body = await req.json();
    const { kd_rek6, nm_rek6, uraian, volume, satuan, harga } = body;

    if (!uraian) {
      return NextResponse.json({ error: "Uraian tidak boleh kosong" }, { status: 400 });
    }

    const total = Number(volume || 0) * Number(harga || 0);

    // Dapatkan data RBA untuk menyalin info kegiatan
    const rba = await prisma.tblRba.findUnique({
      where: { no_rba }
    });

    if (!rba) {
      return NextResponse.json({ error: "RBA tidak ditemukan" }, { status: 404 });
    }

    // Insert rincian baru
    const newRincian = await prisma.tblRbaRincian.create({
      data: {
        no_rba,
        kdUkm: rba.kdUkm,
        nmUkm: rba.nmUkm,
        kdPeruntukan: rba.kdPeruntukan,
        nmPeruntukan: rba.nmPeruntukan,
        kdKomponen: rba.kdKomponen,
        nmKomponen: rba.nmKomponen,
        kdRincian: rba.kdRincian,
        nmRincian: rba.nmRincian,
        kdSubKegiatan: rba.kdSubKegiatan,
        nmSubKegiatan: rba.nmSubKegiatan,
        kdSpm: rba.kdSpm,
        nmSpm: rba.nmSpm,

        kd_rek6,
        nm_rek6,
        uraian,
        volume,
        satuan,
        nilai: harga,
        total: total,

        tgl_update: new Date(),
        username: payload.username,
        aksi: "tambah rincian dari PUK",
      }
    });

    // Update parent RBA (recalculate total)
    const allRincian = await prisma.tblRbaRincian.findMany({ where: { no_rba } });
    const grandTotal = allRincian.reduce((sum, r) => sum + Number(r.total || 0), 0);

    await prisma.tblRba.update({
      where: { no_rba },
      data: { nilai: grandTotal, tgl_update: new Date(), username: payload.username }
    });

    return NextResponse.json({
      message: "Rincian berhasil ditambahkan",
      data: {
        ...newRincian,
        id: newRincian.id.toString()
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = auth;

    const resolvedParams = await params;
    const { id: no_rba } = resolvedParams;

    const url = new URL(req.url);
    const rincian_id = url.searchParams.get("rincian_id");

    if (!rincian_id) return NextResponse.json({ error: "Rincian ID wajib" }, { status: 400 });

    let parsedId: bigint;
    try {
      parsedId = BigInt(rincian_id);
    } catch (e) {
      return NextResponse.json({ error: "Format Rincian ID tidak valid" }, { status: 400 });
    }

    const rincianRba = await prisma.tblRbaRincian.findUnique({ where: { id: parsedId } });
    if (!rincianRba) return NextResponse.json({ error: "Rincian RBA tidak ditemukan" }, { status: 404 });

    // Delete rincian RBA
    await prisma.tblRbaRincian.delete({
      where: { id: parsedId }
    });

    // Update parent RBA (recalculate total)
    const allRincian = await prisma.tblRbaRincian.findMany({ where: { no_rba } });
    const grandTotal = allRincian.reduce((sum, r) => sum + Number(r.total || 0), 0);

    await prisma.tblRba.update({
      where: { no_rba },
      data: { nilai: grandTotal, tgl_update: new Date(), username: payload.username }
    });

    return NextResponse.json({
      message: "Rincian berhasil dihapus",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

