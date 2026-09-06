import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const data = await prisma.msUpt.findMany({
      orderBy: { nm_upt: "asc" }
    });
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
