import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const tahun = searchParams.get("tahun") || auth.tahun || new Date().getFullYear().toString();
    const where: any = { 
      tahun,
      nmSubKegiatan: { contains: "pendapatan", mode: "insensitive" }
    };

    let selectedUpt = "";
    if (auth.role !== "superadmin") {
      where.kdUnit = auth.kd_upt;
      selectedUpt = auth.kd_upt || "";
    } else {
      const kd_upt = searchParams.get("kd_upt");
      if (kd_upt) {
        where.kdUnit = kd_upt;
        selectedUpt = kd_upt;
      }
    }

    if (!selectedUpt) {
      return NextResponse.json({ error: "UPT belum dipilih. Silakan filter UPT terlebih dahulu untuk mencetak." }, { status: 400 });
    }

    // Get UPT detail for Kop Surat
    const upt = await prisma.msUpt.findFirst({
      where: { kd_upt: selectedUpt }
    });

    // Get Penandatangan KPA (kode 1)
    const penandatangan = await prisma.penandatangan.findFirst({
      where: {
        kd_upt: selectedUpt,
        kode: 1,
        status: 1
      },
      orderBy: { id: "desc" }
    });

    const dataRaw = await prisma.tblRba.findMany({
      where,
      orderBy: [
        { kdUkm: 'asc' },
        { kdPeruntukan: 'asc' },
        { kdKomponen: 'asc' },
        { kdRincian: 'asc' },
        { kdSubKegiatan: 'asc' }
      ],
      include: {
        rincian: {
          orderBy: {
            id: 'asc'
          }
        }
      }
    });

    const serializedData = JSON.parse(JSON.stringify({
      upt,
      penandatangan,
      data: dataRaw,
      tahun
    }, (key, value) => (typeof value === 'bigint' ? value.toString() : value)));

    return NextResponse.json(serializedData);

  } catch (error: any) {
    console.error("GET RBA CETAK Error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
