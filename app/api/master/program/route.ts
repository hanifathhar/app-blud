import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

// GET all Program
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
        { kd_program: { contains: q, mode: "insensitive" } },
        { nm_program: { contains: q, mode: "insensitive" } },
      ]
    } : undefined;

    const [data, total] = await Promise.all([
      prisma.mProg.findMany({
        where,
        skip,
        take: limit,
        orderBy: { kd_program: "asc" }
      }),
      prisma.mProg.count({ where })
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

// CREATE new Program
export async function POST(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth || auth.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { kd_program, nm_program, kd_skpd, lpermen, kd_urusan } = body;

    if (!kd_program || !nm_program) {
      return NextResponse.json({ error: "Kode dan Nama Program wajib diisi" }, { status: 400 });
    }

    const created = await prisma.mProg.create({
      data: {
        kd_program,
        nm_program,
        kd_skpd: kd_skpd || null,
        lpermen: lpermen !== undefined ? parseInt(lpermen) : 0,
        kd_urusan: kd_urusan || null
      }
    });

    return NextResponse.json({ message: "Data Program berhasil ditambahkan", data: created });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server" }, { status: 500 });
  }
}

// UPDATE Program
export async function PUT(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth || auth.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { id, kd_program, nm_program, kd_skpd, lpermen, kd_urusan } = body;

    if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });
    if (!kd_program || !nm_program) {
      return NextResponse.json({ error: "Kode dan Nama Program wajib diisi" }, { status: 400 });
    }

    const updated = await prisma.mProg.update({
      where: { id: parseInt(id) },
      data: {
        kd_program,
        nm_program,
        kd_skpd: kd_skpd || null,
        lpermen: lpermen !== undefined ? parseInt(lpermen) : 0,
        kd_urusan: kd_urusan || null
      }
    });

    return NextResponse.json({ message: "Data berhasil diperbarui", data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server" }, { status: 500 });
  }
}

// DELETE Program
export async function DELETE(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth || auth.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });

    await prisma.mProg.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ message: "Data Program berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server saat menghapus data" }, { status: 500 });
  }
}
