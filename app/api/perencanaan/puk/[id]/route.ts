import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

export async function PUT(req: NextRequest, context: any) {
  try {
    const { id } = await context.params;
    const auth = getUserFromRequest(req);
    if (!auth || !["superadmin", "kpa", "perencana"].includes(auth.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    const existing = await prisma.tblPuk.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Data PUK tidak ditemukan" }, { status: 404 });
    }

    // Hanya superadmin yang bisa ubah UPT, selain itu biarkan data asal
    const kd_upt = auth.role === "superadmin" ? (body.kdUpt || existing.kdUpt) : existing.kdUpt;
    const nm_upt = auth.role === "superadmin" ? (body.nmUpt || existing.nmUpt) : existing.nmUpt;

    const noPuk = `${kd_upt || ""}${body.kdUkm || ""}${body.kdPeruntukan || ""}${body.kdKomponen || ""}${body.kdRincian || ""}${body.kdSubKegiatan || ""}`;

    // Cek jika noPuk berubah dan apakah sudah digunakan oleh record lain
    if (noPuk !== existing.noPuk) {
      const duplicate = await prisma.tblPuk.findUnique({ where: { noPuk } });
      if (duplicate) {
        return NextResponse.json({ error: `PUK dengan kombinasi ini sudah ada (No PUK: ${noPuk})` }, { status: 400 });
      }
    }

    const updated = await prisma.tblPuk.update({
      where: { id },
      data: {
        noPuk,
        kdUpt: kd_upt,
        nmUpt: nm_upt,
        kdUkm: body.kdUkm,
        nmUkm: body.nmUkm,
        kdPeruntukan: body.kdPeruntukan,
        nmPeruntukan: body.nmPeruntukan,
        kdKomponen: body.kdKomponen,
        nmKomponen: body.nmKomponen,
        kdRincian: body.kdRincian,
        nmRincian: body.nmRincian,
        kdSubKegiatan: body.kdSubKegiatan,
        nmSubKegiatan: body.nmSubKegiatan,
        kdSpm: body.kdSpm !== undefined && body.kdSpm !== null ? String(body.kdSpm) : null,
        nmSpm: body.nmSpm,
        tujuan: body.tujuan,
        sasaran: body.sasaran,
        targetSasaran: body.targetSasaran,
        targetObjek: body.targetObjek ? parseInt(body.targetObjek) : null,
        penanggungjawab: body.penanggungjawab,
        nilai: body.nilai ? parseFloat(body.nilai) : 0,
        jan: body.jan ? parseFloat(body.jan) : 0,
        feb: body.feb ? parseFloat(body.feb) : 0,
        mar: body.mar ? parseFloat(body.mar) : 0,
        apr: body.apr ? parseFloat(body.apr) : 0,
        mei: body.mei ? parseFloat(body.mei) : 0,
        jun: body.jun ? parseFloat(body.jun) : 0,
        jul: body.jul ? parseFloat(body.jul) : 0,
        agus: body.agus ? parseFloat(body.agus) : 0,
        sep: body.sep ? parseFloat(body.sep) : 0,
        okt: body.okt ? parseFloat(body.okt) : 0,
        nov: body.nov ? parseFloat(body.nov) : 0,
        des: body.des ? parseFloat(body.des) : 0,
        lokasi: body.lokasi,
        sumdan: body.sumdan,
        username: auth.username,
        tglUpdate: new Date(),
        aksi: "UPDATE"
      }
    });

    return NextResponse.json({ message: "Data PUK berhasil diperbarui", data: updated });
  } catch (error: any) {
    console.error("PUT PUK Error:", error);
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: any) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth || !["superadmin", "kpa", "perencana"].includes(auth.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await context.params;

    const existing = await prisma.tblPuk.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Data PUK tidak ditemukan" }, { status: 404 });
    }

    if (auth.role !== "superadmin" && existing.kdUpt !== auth.kd_upt) {
       return NextResponse.json({ error: "Forbidden - Tidak dapat menghapus PUK milik UPT lain" }, { status: 403 });
    }

    // Validation: Check if PUK is already used in RBA
    const linkedRba = await prisma.tblRba.findFirst({ where: { noPuk: existing.noPuk } });
    if (linkedRba) {
      return NextResponse.json({ error: "Gagal menghapus! PUK ini sudah digunakan dalam RBA." }, { status: 400 });
    }

    // TODO: if there's rincian, maybe we should delete it too. Since cascade delete might not be on Prisma schema, let's delete manually if needed.
    await prisma.tblPukRincian.deleteMany({ where: { noPuk: existing.noPuk } });

    await prisma.tblPuk.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Data PUK berhasil dihapus" });
  } catch (error: any) {
    console.error("DELETE PUK Error:", error);
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server saat menghapus data" }, { status: 500 });
  }
}

export async function GET(req: NextRequest, context: any) {
  try {
    const { id } = await context.params;
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await prisma.tblPuk.findUnique({ where: { id } });
    if (!data) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let nmProgram = "";
    let kdProgram = "";
    let nmKegiatan = "";
    let kdKegiatan = "";

    if (data.kdSubKegiatan) {
      const subGiat = await prisma.mSubGiat.findFirst({
        where: { kd_sub_kegiatan: data.kdSubKegiatan }
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

    const enhancedData = {
      ...data,
      kdProgram,
      nmProgram,
      kdKegiatan,
      nmKegiatan,
    };

    return NextResponse.json({ data: enhancedData });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
