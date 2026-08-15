import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

export async function DELETE(req: NextRequest, context: any) {
  try {
    const { id: idParam } = await context.params;
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = parseInt(idParam);
    if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const rincian = await prisma.tblPukRincian.findUnique({ where: { id } });
    if (!rincian) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.tblPukRincian.delete({ where: { id } });

    // Update parent
    if (rincian.noPuk) {
      const allRincian = await prisma.tblPukRincian.findMany({ where: { noPuk: rincian.noPuk } });
      
      await prisma.tblPuk.update({
        where: { noPuk: rincian.noPuk as string },
        data: {
          jan: allRincian.reduce((acc, r) => acc + Number(r.jan || 0), 0),
          feb: allRincian.reduce((acc, r) => acc + Number(r.feb || 0), 0),
          mar: allRincian.reduce((acc, r) => acc + Number(r.mar || 0), 0),
          apr: allRincian.reduce((acc, r) => acc + Number(r.apr || 0), 0),
          mei: allRincian.reduce((acc, r) => acc + Number(r.mei || 0), 0),
          jun: allRincian.reduce((acc, r) => acc + Number(r.jun || 0), 0),
          jul: allRincian.reduce((acc, r) => acc + Number(r.jul || 0), 0),
          agus: allRincian.reduce((acc, r) => acc + Number(r.agus || 0), 0),
          sep: allRincian.reduce((acc, r) => acc + Number(r.sep || 0), 0),
          okt: allRincian.reduce((acc, r) => acc + Number(r.okt || 0), 0),
          nov: allRincian.reduce((acc, r) => acc + Number(r.nov || 0), 0),
          des: allRincian.reduce((acc, r) => acc + Number(r.des || 0), 0),
          nilai: allRincian.reduce((acc, r) => acc + Number(r.total || 0), 0),
        }
      });
    }

    return NextResponse.json({ message: "Deleted" });
  } catch (err: any) {
    console.error("DELETE rincian error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, context: any) {
  try {
    const { id: idParam } = await context.params;
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id = parseInt(idParam);
    if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const rincian = await prisma.tblPukRincian.findUnique({ where: { id } });
    if (!rincian) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const { 
      uraian, volume, satuan, harga,
      jan, feb, mar, apr, mei, jun, jul, agus, sep, okt, nov, des
    } = body;

    const j = Number(jan || 0); const f = Number(feb || 0); const m = Number(mar || 0);
    const a = Number(apr || 0); const me = Number(mei || 0); const ju = Number(jun || 0);
    const jl = Number(jul || 0); const ag = Number(agus || 0); const s = Number(sep || 0);
    const o = Number(okt || 0); const n = Number(nov || 0); const d = Number(des || 0);

    const volumeNum = Number(volume || 0);
    const hargaNum = Number(harga || 0);
    const total = volumeNum * hargaNum;

    const updatedRincian = await prisma.tblPukRincian.update({
      where: { id },
      data: {
        uraian, 
        volume: volumeNum, 
        satuan: satuan || null,
        harga: hargaNum, 
        total,
        jan: j, feb: f, mar: m, apr: a, mei: me, jun: ju, 
        jul: jl, agus: ag, sep: s, okt: o, nov: n, des: d,
        username: auth.username,
        tglUpdate: new Date(),
        aksi: "Update"
      }
    });

    if (rincian.noPuk) {
      const allRincian = await prisma.tblPukRincian.findMany({ where: { noPuk: rincian.noPuk } });
      await prisma.tblPuk.update({
        where: { noPuk: rincian.noPuk as string },
        data: {
          jan: allRincian.reduce((acc, r) => acc + Number(r.jan || 0), 0),
          feb: allRincian.reduce((acc, r) => acc + Number(r.feb || 0), 0),
          mar: allRincian.reduce((acc, r) => acc + Number(r.mar || 0), 0),
          apr: allRincian.reduce((acc, r) => acc + Number(r.apr || 0), 0),
          mei: allRincian.reduce((acc, r) => acc + Number(r.mei || 0), 0),
          jun: allRincian.reduce((acc, r) => acc + Number(r.jun || 0), 0),
          jul: allRincian.reduce((acc, r) => acc + Number(r.jul || 0), 0),
          agus: allRincian.reduce((acc, r) => acc + Number(r.agus || 0), 0),
          sep: allRincian.reduce((acc, r) => acc + Number(r.sep || 0), 0),
          okt: allRincian.reduce((acc, r) => acc + Number(r.okt || 0), 0),
          nov: allRincian.reduce((acc, r) => acc + Number(r.nov || 0), 0),
          des: allRincian.reduce((acc, r) => acc + Number(r.des || 0), 0),
          nilai: allRincian.reduce((acc, r) => acc + Number(r.total || 0), 0),
        }
      });
    }

    return NextResponse.json({ message: "Updated", data: updatedRincian });
  } catch (err: any) {
    console.error("PUT rincian error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
