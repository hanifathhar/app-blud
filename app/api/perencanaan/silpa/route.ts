import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const tahun = searchParams.get("tahun");
    const kd_upt = auth.role === "superadmin" ? searchParams.get("kdUnit") : auth.kd_upt;

    if (!tahun || !kd_upt) {
      return NextResponse.json({ success: false, message: "Tahun dan Unit diperlukan" }, { status: 400 });
    }

    const data = await prisma.tblSilpa.findMany({
      where: { tahun, kd_upt },
      orderBy: { kd_rek6: 'asc' }
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { tahun, data } = body; // data is array of { kd_rek6, nm_rek6, nilai }
    const kd_upt = auth.role === "superadmin" ? body.kd_upt : auth.kd_upt;

    if (!tahun || !kd_upt || !data) {
      return NextResponse.json({ success: false, message: "Data tidak lengkap" }, { status: 400 });
    }

    const uptData = await prisma.msUpt.findFirst({ where: { kd_upt } });
    const nm_upt = uptData?.nm_upt || "";

    // Proses upsert
    for (const item of data) {
      if (item.nilai !== undefined) {
        await prisma.tblSilpa.upsert({
          where: {
            kd_upt_tahun_kd_rek6: {
              kd_upt,
              tahun,
              kd_rek6: item.kd_rek6
            }
          },
          update: {
            nilai: item.nilai,
            status: "draft"
          },
          create: {
            kd_upt,
            nm_upt,
            tahun,
            kd_rek6: item.kd_rek6,
            nm_rek6: item.nm_rek6,
            nilai: item.nilai,
            status: "draft",
            dibuat_oleh: auth.username
          }
        });
      }
    }

    return NextResponse.json({ success: true, message: "Data berhasil disimpan" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const tahun = searchParams.get("tahun");
    const kd_upt = auth.role === "superadmin" ? searchParams.get("kdUnit") : auth.kd_upt;

    if (!tahun || !kd_upt) {
      return NextResponse.json({ success: false, message: "Tahun dan Unit diperlukan" }, { status: 400 });
    }

    const data = await prisma.tblSilpa.deleteMany({
      where: { tahun, kd_upt }
    });

    return NextResponse.json({ success: true, message: "Data SILPA berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
