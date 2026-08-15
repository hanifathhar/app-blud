import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const payload = auth;

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const kd_upt = searchParams.get("kd_upt") || "";

    let where: any = {
      tahun: searchParams.get("tahun") || payload.tahun || new Date().getFullYear().toString(),
      nmSubKegiatan: { contains: "pendapatan", mode: "insensitive" }
    };

    if (payload.role !== "superadmin") {
      where.kdUnit = payload.kd_upt;
    } else if (kd_upt) {
      where.kdUnit = kd_upt;
    }

    if (q) {
      where.OR = [
        { no_rba: { contains: q, mode: "insensitive" } },
        { nmSubKegiatan: { contains: q, mode: "insensitive" } },
      ];
    }

    const total = await prisma.tblRba.count({ where });
    const data = await prisma.tblRba.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { tgl_update: "desc" },
    });

    // Ambil daftar UPT untuk mengisi nmUnit yang kosong
    const upts = await prisma.msUpt.findMany({ select: { kd_upt: true, nm_upt: true } });
    const uptMap: Record<string, string> = {};
    upts.forEach(u => {
      if (u.kd_upt) {
        uptMap[u.kd_upt] = u.nm_upt || "";
      }
    });

    const formattedData = data.map(item => ({
      ...item,
      id: item.id.toString(),
      nmUnit: item.nmUnit || uptMap[item.kdUnit || ""] || "-"
    }));

    const grandTotalRes = await prisma.tblRba.aggregate({
      where,
      _sum: { nilai: true }
    });

    const summarySumdan = await prisma.tblRba.groupBy({
      by: ["sumdan"],
      where: { ...where, sumdan: { not: null, notIn: [""] } },
      _sum: { nilai: true }
    });

    return NextResponse.json({
      data: formattedData,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
      grandTotal: grandTotalRes._sum.nilai || 0,
      summaryBySumdan: summarySumdan.map(s => ({
        sumdan: s.sumdan,
        total: s._sum.nilai || 0
      }))
    });
  } catch (error: any) {
    console.error("GET RBA Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
