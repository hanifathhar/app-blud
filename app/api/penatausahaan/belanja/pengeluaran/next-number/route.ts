import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const kd_upt = url.searchParams.get("kd_upt") || auth.unit || "";
    const tahun = url.searchParams.get("tahun") || auth.tahun || new Date().getFullYear().toString();

    if (!kd_upt) {
      return NextResponse.json({ error: "Parameter kd_upt diperlukan" }, { status: 400 });
    }

    const countPengeluaran = await prisma.pengeluaran.count({
      where: {
        kd_upt: kd_upt,
        tahun: tahun,
      },
    });

    let nextNo = countPengeluaran + 1;
    let no_pengeluaran = `${String(nextNo).padStart(5, "0")}/${kd_upt}/PENG/${tahun}`;

    // Loop pencegahan jika nomor sudah terpakai
    while (true) {
      const exists = await prisma.pengeluaran.findFirst({
        where: { no_pengeluaran },
        select: { id: true },
      });
      if (!exists) break;
      nextNo += 1;
      no_pengeluaran = `${String(nextNo).padStart(5, "0")}/${kd_upt}/PENG/${tahun}`;
    }

    return NextResponse.json({
      success: true,
      no_pengeluaran,
      next_no_urut: String(nextNo).padStart(5, "0"),
      kd_upt,
      tahun,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
