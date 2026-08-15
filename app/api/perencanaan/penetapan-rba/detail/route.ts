import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const kdUnit = searchParams.get("kdUnit");
    const nomor_penetapan = searchParams.get("nomor_penetapan");

    if (!kdUnit || !nomor_penetapan) {
      return NextResponse.json({ success: false, message: "Parameter tidak lengkap" }, { status: 400 });
    }

    // Security check
    if (auth.role !== "superadmin" && auth.kd_upt !== kdUnit) {
      return NextResponse.json({ success: false, message: "Akses ditolak" }, { status: 403 });
    }

    const data = await prisma.tblRbaPenetapan.findMany({
      where: { kdUnit, nomor_penetapan },
      orderBy: { tgl_update: "desc" },
      include: { rincian: true }
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
