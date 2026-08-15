import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "50");
    const startsWith = searchParams.get("startsWith") || "";

    let where: any = {};
    if (q) {
      where.OR = [
        { kd_rek6: { contains: q, mode: "insensitive" } },
        { nm_rek6: { contains: q, mode: "insensitive" } },
      ];
    }
    
    if (startsWith) {
      where.kd_rek6 = { ...where.kd_rek6, startsWith };
    }

    const data = await prisma.msRek6.findMany({
      where,
      take: limit,
      orderBy: { kd_rek6: "asc" }
    });

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error("Error fetching ms_rek6:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
