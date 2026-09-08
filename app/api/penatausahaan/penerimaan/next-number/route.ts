import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const kd_upt = url.searchParams.get("kd_upt") || auth.unit || auth.kd_upt || "";
    const tahun = url.searchParams.get("tahun") || auth.tahun || new Date().getFullYear().toString();

    if (!kd_upt) {
      return NextResponse.json({ success: false, message: "Parameter kd_upt diperlukan" }, { status: 400 });
    }

    const countPenerimaan = await prisma.tblPenerimaan.count({
      where: {
        kdUnit: kd_upt,
        tahun: tahun,
      },
    });

    let nextNo = countPenerimaan + 1;
    let no_bukti = `${String(nextNo).padStart(5, "0")}/${kd_upt}/PNP/${tahun}`;

    // Loop pencegahan jika no_bukti sudah ada
    while (true) {
      const exists = await prisma.tblPenerimaan.findFirst({
        where: { noBukti: no_bukti },
        select: { idTerima: true },
      });
      if (!exists) break;
      nextNo += 1;
      no_bukti = `${String(nextNo).padStart(5, "0")}/${kd_upt}/PNP/${tahun}`;
    }

    return NextResponse.json({
      success: true,
      no_bukti,
      next_no_urut: String(nextNo).padStart(5, "0"),
      kd_upt,
      tahun,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
