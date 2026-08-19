import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const data = await prisma.tblPenerimaan.findUnique({
      where: { idTerima: parseInt(id) },
    });

    if (!data) return NextResponse.json({ success: false, message: "Penerimaan not found" }, { status: 404 });

    if (user.role !== "superadmin" && user.kd_upt !== data.kdUnit) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    if (!["superadmin", "bendahara"].includes(user.role)) {
      return NextResponse.json({ success: false, message: "Forbidden: Only Admin and Bendahara can edit" }, { status: 403 });
    }

    const idTerima = parseInt(id);
    const existing = await prisma.tblPenerimaan.findUnique({ where: { idTerima } });
    
    if (!existing) return NextResponse.json({ success: false, message: "Penerimaan not found" }, { status: 404 });
    if (user.role !== "superadmin" && user.kd_upt !== existing.kdUnit) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }
    if (existing.verif === 1) {
      return NextResponse.json({ success: false, message: "Cannot edit verified data" }, { status: 400 });
    }

    const body = await req.json();

    const data = await prisma.tblPenerimaan.update({
      where: { idTerima },
      data: {
        noBukti: body.noBukti,
        tglBukti: body.tglBukti ? new Date(body.tglBukti) : null,
        kdSubKegiatan: body.kdSubKegiatan,
        nmSubKegiatan: body.nmSubKegiatan,
        kdRek6: body.kdRek6,
        nmRek6: body.nmRek6,
        nilai: body.nilai ? parseFloat(body.nilai) : 0,
        keterangan: body.keterangan,
        nmPenyetor: body.nmPenyetor,
        sumdan: body.sumdan,
        tahun: body.tahun,
        username: user.username,
        tglUpdate: new Date(),
        aksi: "edit",
      },
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    if (!["superadmin", "bendahara"].includes(user.role)) {
      return NextResponse.json({ success: false, message: "Forbidden: Only Admin and Bendahara can delete" }, { status: 403 });
    }

    const idTerima = parseInt(id);
    const existing = await prisma.tblPenerimaan.findUnique({ where: { idTerima } });
    
    if (!existing) return NextResponse.json({ success: false, message: "Penerimaan not found" }, { status: 404 });
    if (user.role !== "superadmin" && user.kd_upt !== existing.kdUnit) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }
    if (existing.verif === 1) {
      return NextResponse.json({ success: false, message: "Cannot delete verified data" }, { status: 400 });
    }

    await prisma.tblPenerimaan.delete({ where: { idTerima } });

    return NextResponse.json({ success: true, message: "Penerimaan deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
