import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

// GET all Kegiatan
export async function GET(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const q = searchParams.get("q") || "";
    const program = searchParams.get("program") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where: any = {
      AND: []
    };

    if (q) {
      where.AND.push({
        OR: [
          { kd_kegiatan: { contains: q, mode: "insensitive" } },
          { nm_kegiatan: { contains: q, mode: "insensitive" } },
        ]
      });
    }

    if (program) {
      where.AND.push({ kd_program: program });
    }

    if (where.AND.length === 0) {
      delete where.AND;
    }

    const [data, total] = await Promise.all([
      prisma.mGiat.findMany({
        where,
        skip,
        take: limit,
        orderBy: { kd_kegiatan: "asc" }
      }),
      prisma.mGiat.count({ where })
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

// CREATE new Kegiatan
export async function POST(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth || auth.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { kd_kegiatan, kd_program, nm_kegiatan, jns_kegiatan, lpermen } = body;

    if (!kd_kegiatan || !kd_program || !nm_kegiatan) {
      return NextResponse.json({ error: "Kolom bertanda (*) wajib diisi" }, { status: 400 });
    }

    // Cek apakah kode kegiatan sudah digunakan
    const existingCode = await prisma.mGiat.findFirst({
      where: { kd_kegiatan: kd_kegiatan }
    });

    if (existingCode) {
      return NextResponse.json({ error: `Kode Kegiatan '${kd_kegiatan}' sudah digunakan. Silakan gunakan kode lain.` }, { status: 400 });
    }

    const created = await prisma.mGiat.create({
      data: {
        kd_kegiatan,
        kd_program,
        nm_kegiatan,
        jns_kegiatan: jns_kegiatan !== undefined ? parseFloat(jns_kegiatan) : null,
        lpermen: lpermen || null
      }
    });

    return NextResponse.json({ message: "Data Kegiatan berhasil ditambahkan", data: created });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server" }, { status: 500 });
  }
}

// UPDATE Kegiatan
export async function PUT(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth || auth.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { id, kd_kegiatan, kd_program, nm_kegiatan, jns_kegiatan, lpermen } = body;

    if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });
    if (!kd_kegiatan || !nm_kegiatan || !kd_program) {
      return NextResponse.json({ error: "Kolom bertanda (*) wajib diisi" }, { status: 400 });
    }

    // Cek apakah kode kegiatan sudah digunakan oleh ID lain
    const existingCode = await prisma.mGiat.findFirst({
      where: { 
        kd_kegiatan: kd_kegiatan,
        id: { not: parseInt(id) }
      }
    });

    if (existingCode) {
      return NextResponse.json({ error: `Kode Kegiatan '${kd_kegiatan}' sudah digunakan oleh data lain.` }, { status: 400 });
    }

    const updated = await prisma.mGiat.update({
      where: { id: parseInt(id) },
      data: {
        kd_kegiatan,
        kd_program,
        nm_kegiatan,
        jns_kegiatan: jns_kegiatan !== undefined ? parseFloat(jns_kegiatan) : null,
        lpermen: lpermen || null
      }
    });

    return NextResponse.json({ message: "Data berhasil diperbarui", data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server" }, { status: 500 });
  }
}

// DELETE Kegiatan
export async function DELETE(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth || auth.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });

    await prisma.mGiat.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ message: "Data Kegiatan berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server saat menghapus data" }, { status: 500 });
  }
}
