import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: no_rba } = await params;

    const rba = await prisma.tblRba.findUnique({
      where: { no_rba }
    });

    if (!rba) {
      return NextResponse.json({ error: "Data RBA tidak ditemukan" }, { status: 404 });
    }

    // Role check
    if (auth.role !== "superadmin" && rba.kdUnit !== auth.kd_upt) {
       return NextResponse.json({ error: "Forbidden - Tidak dapat menghapus RBA milik UPT lain" }, { status: 403 });
    }

    // Hapus rincian terlebih dahulu (karena kita mungkin tidak set ON DELETE CASCADE di prisma)
    await prisma.tblRbaRincian.deleteMany({
      where: { no_rba: rba.no_rba }
    });

    // Hapus parent RBA
    await prisma.tblRba.delete({
      where: { no_rba: rba.no_rba }
    });

    return NextResponse.json({ message: "RBA berhasil dibatalkan/dihapus" });
  } catch (error: any) {
    console.error("DELETE RBA Error:", error);
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server" }, { status: 500 });
  }
}
