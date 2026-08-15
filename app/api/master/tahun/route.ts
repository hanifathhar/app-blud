import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

// GET all Tahun Anggaran
export async function GET(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const q = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    let where: any = undefined;
    if (q && !isNaN(parseInt(q))) {
      where = { tahun: parseInt(q) };
    }

    const [data, total] = await Promise.all([
      prisma.tahunAnggaran.findMany({
        where,
        skip,
        take: limit,
        orderBy: { tahun: "desc" }
      }),
      prisma.tahunAnggaran.count({ where })
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

// CREATE new Tahun Anggaran
export async function POST(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth || auth.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { tahun, keterangan, status } = body;

    if (!tahun || isNaN(parseInt(tahun))) {
      return NextResponse.json({ error: "Tahun tidak valid" }, { status: 400 });
    }

    // Check if exists
    const existing = await prisma.tahunAnggaran.findUnique({
      where: { tahun: parseInt(tahun) }
    });

    if (existing) {
      return NextResponse.json({ error: "Tahun anggaran sudah ada" }, { status: 400 });
    }

    const created = await prisma.tahunAnggaran.create({
      data: {
        tahun: parseInt(tahun),
        status: status || "aktif",
        keterangan: keterangan || null
      }
    });

    return NextResponse.json({ message: "Tahun Anggaran berhasil ditambahkan", data: created });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server" }, { status: 500 });
  }
}

// UPDATE Tahun Anggaran
export async function PUT(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth || auth.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { id, status, keterangan } = body;

    if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });

    const updated = await prisma.tahunAnggaran.update({
      where: { id: parseInt(id) },
      data: {
        status: status !== undefined ? status : undefined,
        keterangan: keterangan !== undefined ? keterangan : undefined
      }
    });

    return NextResponse.json({ message: "Data berhasil diperbarui", data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server" }, { status: 500 });
  }
}

// DELETE Tahun Anggaran
export async function DELETE(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth || auth.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });

    await prisma.tahunAnggaran.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ message: "Tahun Anggaran berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server saat menghapus data" }, { status: 500 });
  }
}
