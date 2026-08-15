import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = auth;

    const { searchParams } = new URL(req.url);
    const kd_upt = searchParams.get("kd_upt");

    let where: any = { 
      tahun: payload.tahun || new Date().getFullYear().toString(),
      NOT: {
        nmSubKegiatan: {
          contains: "pendapatan",
          mode: "insensitive"
        }
      }
    };
    
    if (payload.role !== "superadmin") {
      where.kdUpt = payload.kd_upt;
    } else if (kd_upt) {
      where.kdUpt = kd_upt;
    }

    // Ambil noPuk yang sudah ada di RBA
    const existingRba = await prisma.tblRba.findMany({
      where: { tahun: where.tahun, kdUnit: where.kdUpt },
      select: { noPuk: true }
    });
    
    const usedNoPuk = existingRba.map(r => r.noPuk).filter(Boolean);

    // Filter PUK yang noPuk-nya belum ada di RBA
    if (usedNoPuk.length > 0) {
      where.noPuk = { notIn: usedNoPuk };
    }

    const data = await prisma.tblPuk.findMany({
      where,
      select: {
        id: true,
        noPuk: true,
        nmUkm: true,
        nmPeruntukan: true,
        nmKomponen: true,
        nmRincian: true,
        nmSubKegiatan: true,
        nilai: true
      },
      orderBy: { nmSubKegiatan: "asc" }
    });

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("GET PUK Options Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
