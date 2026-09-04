import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const tahun = searchParams.get("tahun") || new Date().getFullYear().toString();
    const where: any = { 
      tahun,
      NOT: {
        nmSubKegiatan: {
          contains: "pendapatan",
          mode: "insensitive"
        }
      }
    };

    let selectedUpt = "";
    if (auth.role !== "superadmin") {
      where.kdUpt = auth.kd_upt;
      selectedUpt = auth.kd_upt || "";
    } else {
      const kd_upt = searchParams.get("kd_upt");
      if (kd_upt) {
        where.kdUpt = kd_upt;
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

    const dataRaw = await prisma.tblPuk.findMany({
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

    return NextResponse.json({
      upt,
      data: dataRaw,
      tahun
    });

  } catch (error: any) {
    console.error("GET PUK CETAK Error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
