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

    let whereClause: any = {
      status: "belum_dibayar"
    };

    if (tahun) whereClause.tahun = tahun;

    let uptFilters: any[] = [];
    if (auth.level !== 1 && kd_upt) {
      uptFilters.push({ kd_upt: kd_upt });
    }
    
    // Khusus admin bisa filter by UPT
    const param_kd_upt = url.searchParams.get("kd_upt");
    if (auth.level === 1 && param_kd_upt) {
      uptFilters.push({ kd_upt: param_kd_upt });
    }

    if (uptFilters.length > 0) {
      whereClause.AND = whereClause.AND || [];
      whereClause.AND.push({ OR: uptFilters });
    }

    const tagihanList = await prisma.tagihan.findMany({
      where: whereClause,
      include: {
        rincian: true,
      },
      orderBy: {
        tgl_dibuat: "desc",
      }
    });

    return NextResponse.json({ 
      data: tagihanList
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
