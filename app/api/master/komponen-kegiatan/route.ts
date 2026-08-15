import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

// GET all Komponen Kegiatan
export async function GET(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const q = searchParams.get("q") || "";
    const peruntukan = searchParams.get("peruntukan") || "";
    
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where: any = {
      AND: []
    };

    if (q) {
      where.AND.push({
        OR: [
          { kd_komponen: { contains: q, mode: "insensitive" } },
          { nm_komponen: { contains: q, mode: "insensitive" } },
        ]
      });
    }

    if (peruntukan) {
      where.AND.push({ kd_peruntukan: peruntukan });
    }

    if (where.AND.length === 0) {
      delete where.AND;
    }

    const [data, total] = await Promise.all([
      prisma.mKomponen.findMany({
        where,
        skip,
        take: limit,
        orderBy: { kd_komponen: "asc" }
      }),
      prisma.mKomponen.count({ where })
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

// CREATE new Komponen
export async function POST(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth || auth.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { kd_komponen, kd_peruntukan, nm_komponen } = body;

    if (!kd_komponen || !kd_peruntukan || !nm_komponen) {
      return NextResponse.json({ error: "Semua kolom wajib diisi" }, { status: 400 });
    }

    // Cek apakah kode komponen sudah digunakan
    const existingCode = await prisma.mKomponen.findFirst({
      where: { kd_komponen: kd_komponen }
    });

    if (existingCode) {
      return NextResponse.json({ error: `Kode Komponen '${kd_komponen}' sudah digunakan. Silakan gunakan kode lain.` }, { status: 400 });
    }

    const created = await prisma.mKomponen.create({
      data: {
        kd_komponen,
        kd_peruntukan,
        nm_komponen
      }
    });

    return NextResponse.json({ message: "Data Komponen berhasil ditambahkan", data: created });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server" }, { status: 500 });
  }
}

// UPDATE Komponen
export async function PUT(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth || auth.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { id, kd_komponen, kd_peruntukan, nm_komponen } = body;

    if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });
    if (!kd_komponen || !kd_peruntukan || !nm_komponen) {
      return NextResponse.json({ error: "Semua kolom wajib diisi" }, { status: 400 });
    }

    // Cek apakah kode komponen sudah digunakan oleh ID lain
    const existingCode = await prisma.mKomponen.findFirst({
      where: { 
        kd_komponen: kd_komponen,
        id: { not: parseInt(id) }
      }
    });

    if (existingCode) {
      return NextResponse.json({ error: `Kode Komponen '${kd_komponen}' sudah digunakan oleh data lain.` }, { status: 400 });
    }

    const updated = await prisma.mKomponen.update({
      where: { id: parseInt(id) },
      data: {
        kd_komponen,
        kd_peruntukan,
        nm_komponen
      }
    });

    return NextResponse.json({ message: "Data berhasil diperbarui", data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server" }, { status: 500 });
  }
}

// DELETE Komponen
export async function DELETE(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth || auth.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });

    await prisma.mKomponen.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ message: "Data Komponen berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server saat menghapus data" }, { status: 500 });
  }
}
