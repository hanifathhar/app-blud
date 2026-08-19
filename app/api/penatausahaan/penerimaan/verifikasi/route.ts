import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    // Based on user feedback: keuangan verifies
    if (!["superadmin", "keuangan"].includes(user.role)) {
      return NextResponse.json({ success: false, message: "Forbidden: Only Keuangan can verify" }, { status: 403 });
    }

    const body = await req.json();
    const { idTerima, action } = body;

    const existing = await prisma.tblPenerimaan.findUnique({ where: { idTerima } });
    if (!existing) return NextResponse.json({ success: false, message: "Penerimaan not found" }, { status: 404 });

    if (user.role !== "superadmin" && user.kd_upt !== existing.kdUnit) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    let verifStatus = 0;
    if (action === "verifikasi") {
      verifStatus = 1;
    } else if (action === "batal_verifikasi") {
      verifStatus = 0;
    } else {
      return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
    }

    const data = await prisma.tblPenerimaan.update({
      where: { idTerima },
      data: {
        verif: verifStatus,
        tglVerif: verifStatus === 1 ? new Date() : null,
        userVerif: verifStatus === 1 ? user.username : null,
        aksi: action,
        tglUpdate: new Date(),
      },
    });

    return NextResponse.json({ success: true, data, message: verifStatus === 1 ? "Berhasil diverifikasi" : "Verifikasi dibatalkan" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
