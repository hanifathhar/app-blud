import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const kd_upt = searchParams.get("kd_upt") || user.kd_upt;
    const tahun = searchParams.get("tahun") || new Date().getFullYear().toString();

    const where: any = {};
    if (user.role !== "superadmin") {
      where.kdUnit = user.kd_upt;
    } else if (kd_upt) {
      where.kdUnit = kd_upt;
    }
    where.tahun = tahun;

    // Filter only pendapatan (usually starts with 4)
    where.kd_rek6 = { startsWith: "4" };

    const data = await prisma.tblRbaRincianPenetapan.groupBy({
      by: ['kd_rek6', 'nm_rek6'],
      where,
      orderBy: { kd_rek6: 'asc' }
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
