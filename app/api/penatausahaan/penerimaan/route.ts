import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const kd_upt = searchParams.get("kd_upt") || user.kd_upt;
    const tahun = searchParams.get("tahun");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const where: any = {};

    if (user.role !== "superadmin") {
      where.kdUnit = user.kd_upt;
    } else if (kd_upt) {
      where.kdUnit = kd_upt;
    }

    if (tahun) {
      where.tahun = tahun;
    }

    if (search) {
      where.OR = [
        { noBukti: { contains: search, mode: "insensitive" } },
        { nmPenyetor: { contains: search, mode: "insensitive" } },
        { keterangan: { contains: search, mode: "insensitive" } },
      ];
    }

    const total = await prisma.tblPenerimaan.count({ where });
    const data = await prisma.tblPenerimaan.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { idTerima: "desc" },
    });

    const totalNilaiAgg = await prisma.tblPenerimaan.aggregate({
      where: { ...where, verif: 1 },
      _sum: { nilai: true }
    });
    const totalNilai = totalNilaiAgg._sum.nilai || 0;

    const totalUnverifiedAgg = await prisma.tblPenerimaan.aggregate({
      where: { ...where, verif: 0 },
      _sum: { nilai: true }
    });
    const totalUnverified = totalUnverifiedAgg._sum.nilai || 0;

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      totalNilai,
      totalUnverified,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    // Based on user feedback: bendahara and admin can input
    if (!["superadmin", "bendahara"].includes(user.role)) {
      return NextResponse.json({ success: false, message: "Forbidden: Only Admin and Bendahara can input" }, { status: 403 });
    }

    const body = await req.json();
    const kdUnit = user.role === "superadmin" ? body.kdUnit : user.kd_upt;

    const data = await prisma.tblPenerimaan.create({
      data: {
        noBukti: body.noBukti,
        tglBukti: body.tglBukti ? new Date(body.tglBukti) : null,
        kdUnit: kdUnit,
        nmUnit: body.nmUnit,
        kdSubKegiatan: body.kdSubKegiatan,
        nmSubKegiatan: body.nmSubKegiatan,
        kdRek6: body.kdRek6,
        nmRek6: body.nmRek6,
        nilai: body.nilai ? parseFloat(body.nilai) : 0,
        keterangan: body.keterangan,
        nmPenyetor: body.nmPenyetor,
        sumdan: body.sumdan || "",
        tahun: body.tahun,
        username: user.username,
        tglUpdate: new Date(),
        verif: 0,
        pengesahan: 0,
        jenis: body.jenis || "1",
        aksi: "tambah",
      },
    });

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
