import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

// GET all Peruntukan
export async function GET(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const q = searchParams.get("q") || "";
    
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (q) {
      where.OR = [
        { kd_peruntukan: { contains: q, mode: "insensitive" } },
        { nm_peruntukan: { contains: q, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.mPeruntukan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { kd_peruntukan: "asc" }
      }),
      prisma.mPeruntukan.count({ where })
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

// CREATE new Peruntukan
export async function POST(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth || auth.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { kd_peruntukan, nm_peruntukan } = body;

    if (!kd_peruntukan || !nm_peruntukan) {
      return NextResponse.json({ error: "Kode dan Nama Peruntukan wajib diisi" }, { status: 400 });
    }

    // Cek apakah kode peruntukan sudah digunakan
    const existingCode = await prisma.mPeruntukan.findFirst({
      where: { kd_peruntukan: kd_peruntukan }
    });

    if (existingCode) {
      return NextResponse.json({ error: `Kode Peruntukan '${kd_peruntukan}' sudah digunakan. Silakan gunakan kode lain.` }, { status: 400 });
    }

    const created = await prisma.mPeruntukan.create({
      data: {
        kd_peruntukan,
        nm_peruntukan
      }
    });

    return NextResponse.json({ message: "Data Peruntukan berhasil ditambahkan", data: created });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server" }, { status: 500 });
  }
}

// UPDATE Peruntukan
export async function PUT(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth || auth.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { id, kd_peruntukan, nm_peruntukan } = body;

    if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });
    if (!kd_peruntukan || !nm_peruntukan) {
      return NextResponse.json({ error: "Kode dan Nama Peruntukan wajib diisi" }, { status: 400 });
    }

    // Cek apakah kode peruntukan sudah digunakan oleh ID lain
    const existingCode = await prisma.mPeruntukan.findFirst({
      where: { 
        kd_peruntukan: kd_peruntukan,
        id: { not: parseInt(id) }
      }
    });

    if (existingCode) {
      return NextResponse.json({ error: `Kode Peruntukan '${kd_peruntukan}' sudah digunakan oleh data lain.` }, { status: 400 });
    }

    const updated = await prisma.mPeruntukan.update({
      where: { id: parseInt(id) },
      data: {
        kd_peruntukan,
        nm_peruntukan
      }
    });

    return NextResponse.json({ message: "Data berhasil diperbarui", data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server" }, { status: 500 });
  }
}

// DELETE Peruntukan
export async function DELETE(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth || auth.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });

    await prisma.mPeruntukan.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ message: "Data Peruntukan berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server saat menghapus data" }, { status: 500 });
  }
}
