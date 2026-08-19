import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { tahun, nomor_penetapan, tanggal_penetapan } = body;
    const kd_upt = auth.role === "superadmin" ? body.kd_upt : auth.kd_upt;

    if (!tahun || !kd_upt || !nomor_penetapan || !tanggal_penetapan) {
      return NextResponse.json({ success: false, message: "Data tidak lengkap (Tahun, Unit, Nomor, Tanggal harus diisi)" }, { status: 400 });
    }

    // Tetapkan semua silpa untuk kd_upt dan tahun tersebut
    const result = await prisma.tblSilpa.updateMany({
      where: { kd_upt, tahun },
      data: {
        status: "ditetapkan",
        nomor_penetapan,
        tanggal_penetapan: new Date(tanggal_penetapan)
      }
    });

    if (result.count === 0) {
      return NextResponse.json({ success: false, message: "Tidak ada data SILPA yang bisa ditetapkan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: `Berhasil menetapkan ${result.count} data SILPA` });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
