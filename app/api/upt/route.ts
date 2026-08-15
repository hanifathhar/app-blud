import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

// GET all UPT
export async function GET(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const q = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where: any = q ? {
      OR: [
        { nm_upt: { contains: q, mode: "insensitive" } },
        { kd_upt: { contains: q, mode: "insensitive" } },
      ]
    } : undefined;

    const [data, total] = await Promise.all([
      prisma.msUpt.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nm_upt: "asc" }
      }),
      prisma.msUpt.count({ where })
    ]);

    return NextResponse.json({ 
      data, 
      pagination: { 
        total, 
        page, 
        limit, 
        totalPages: Math.ceil(total / limit) 
      } 
    });
  } catch (error) {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

// CREATE new UPT
export async function POST(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth || auth.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { kd_upt, nm_upt, type, alamat, kecamatan, kabupaten, email, no_tlp, status } = body;

    if (!nm_upt || !type) {
      return NextResponse.json({ error: "Nama UPT dan Tipe wajib diisi" }, { status: 400 });
    }

    const created = await prisma.msUpt.create({
      data: {
        kd_upt: kd_upt || null,
        nm_upt,
        type,
        alamat: alamat || null,
        kecamatan: kecamatan || null,
        kabupaten: kabupaten || null,
        email: email || null,
        no_tlp: no_tlp || null,
        status: status !== undefined ? parseInt(status) : 1
      }
    });

    return NextResponse.json({ message: "Data UPT berhasil ditambahkan", data: created });
  } catch (error) {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
