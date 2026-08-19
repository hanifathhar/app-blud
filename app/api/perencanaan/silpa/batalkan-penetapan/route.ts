import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth || !["superadmin", "kpa", "perencana"].includes(auth.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const kd_upt = auth.role === "superadmin" ? body.kdUnit : auth.kd_upt;
    const tahun = body.tahun || new Date().getFullYear().toString();

    if (!kd_upt) {
      return NextResponse.json({ success: false, message: "UPT belum dipilih" }, { status: 400 });
    }

    // Ambil data SILPA yang ditetapkan
    const silpas = await prisma.tblSilpa.findMany({
      where: { kd_upt, tahun, status: "ditetapkan" }
    });

    if (silpas.length === 0) {
      return NextResponse.json({ success: false, message: "Tidak ada penetapan SILPA yang aktif." }, { status: 400 });
    }

    // Ambil nomor_penetapan dari SILPA
    const nomor_penetapan = silpas[0].nomor_penetapan;

    // Hapus dari tblRbaPenetapan
    if (nomor_penetapan) {
      const rek6List = silpas.map(s => s.kd_rek6);
      await prisma.tblRbaPenetapan.deleteMany({
        where: {
          kdUnit: kd_upt,
          nomor_penetapan,
          kd_rek6: { in: rek6List }
        }
      });
    }

    // Kembalikan status SILPA menjadi draft
    await prisma.tblSilpa.updateMany({
      where: { kd_upt, tahun, status: "ditetapkan" },
      data: {
        status: "draft",
        nomor_penetapan: null,
        tanggal_penetapan: null
      }
    });

    return NextResponse.json({ success: true, message: "Penetapan SILPA berhasil dibatalkan." });
  } catch (error: any) {
    console.error("Batalkan Penetapan SILPA Error:", error);
    return NextResponse.json({ success: false, message: error.message || "Terjadi kesalahan server" }, { status: 500 });
  }
}
