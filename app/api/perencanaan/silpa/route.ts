import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

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

    const data: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "tbl_silpa" WHERE "tahun" = $1 AND "kd_upt" = $2 ORDER BY "kd_rek6" ASC, "sumdan" ASC`,
      tahun,
      kd_upt
    );

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
    const { tahun, data } = body; // data is array of { kd_rek6, nm_rek6, sumdan, nilai }
    const kd_upt = auth.role === "superadmin" ? body.kd_upt : auth.kd_upt;

    if (!tahun || !kd_upt || !data || !Array.isArray(data)) {
      return NextResponse.json({ success: false, message: "Data tidak lengkap" }, { status: 400 });
    }

    const uptData = await prisma.msUpt.findFirst({ where: { kd_upt } });
    const nm_upt = uptData?.nm_upt || "";

    // Proses upsert dengan dukungan sumdan
    for (const item of data) {
      if (item.nilai !== undefined) {
        const sumdan = (item.sumdan || "BLUD").trim().toUpperCase();
        const nilai = Number(item.nilai) || 0;
        await prisma.$executeRawUnsafe(
          `INSERT INTO "tbl_silpa" ("kd_upt", "nm_upt", "tahun", "kd_rek6", "nm_rek6", "sumdan", "nilai", "status", "dibuat_oleh", "tgl_dibuat", "tgl_update")
           VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft', $8, NOW(), NOW())
           ON CONFLICT ("kd_upt", "tahun", "kd_rek6", "sumdan")
           DO UPDATE SET 
             "nilai" = EXCLUDED."nilai",
             "status" = 'draft',
             "nm_rek6" = EXCLUDED."nm_rek6",
             "tgl_update" = NOW()`,
          kd_upt,
          nm_upt,
          tahun,
          item.kd_rek6,
          item.nm_rek6,
          sumdan,
          nilai,
          auth.username || auth.nama || "admin"
        );
      }
    }

    return NextResponse.json({ success: true, message: "Data SILPA berhasil disimpan" });
  } catch (error: any) {
    console.error("POST SILPA Error:", error);
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

    await prisma.$executeRawUnsafe(
      `DELETE FROM "tbl_silpa" WHERE "tahun" = $1 AND "kd_upt" = $2`,
      tahun,
      kd_upt
    );

    return NextResponse.json({ success: true, message: "Data SILPA berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
