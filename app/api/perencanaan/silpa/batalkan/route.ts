import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { tahun } = body;
    const kd_upt = auth.role === "superadmin" ? body.kd_upt : auth.kd_upt;

    if (!tahun || !kd_upt) {
      return NextResponse.json({ success: false, message: "Tahun dan Unit diperlukan" }, { status: 400 });
    }

    // Batalkan penetapan (kembalikan ke draft, hapus nomor dan tanggal penetapan)
    const result = await prisma.tblSilpa.updateMany({
      where: { 
        kd_upt, 
        tahun,
        status: "ditetapkan"
      },
      data: {
        status: "draft",
        nomor_penetapan: null,
        tanggal_penetapan: null
      }
    });

    if (result.count === 0) {
      return NextResponse.json({ success: false, message: "Tidak ada data SILPA yang bisa dibatalkan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `Berhasil membatalkan penetapan ${result.count} data SILPA` });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
