import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

// GET all Rincian Kegiatan (Sub Komponen)
export async function GET(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const q = searchParams.get("q") || "";
    const komponen = searchParams.get("komponen") || "";
    
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where: any = {
      AND: []
    };

    if (q) {
      where.AND.push({
        OR: [
          { kd_rincian: { contains: q, mode: "insensitive" } },
          { nm_rincian: { contains: q, mode: "insensitive" } },
        ]
      });
    }

    if (komponen) {
      where.AND.push({ kd_komponen: komponen });
    }

    if (where.AND.length === 0) {
      delete where.AND;
    }

    const [data, total] = await Promise.all([
      prisma.mRincianKegiatan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { kd_rincian: "asc" }
      }),
      prisma.mRincianKegiatan.count({ where })
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

// CREATE new Rincian Kegiatan
export async function POST(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth || auth.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { kd_komponen, kd_rincian, nm_rincian } = body;

    if (!kd_komponen || !kd_rincian || !nm_rincian) {
      return NextResponse.json({ error: "Semua kolom wajib diisi" }, { status: 400 });
    }

    // Cek apakah kode rincian sudah digunakan
    const existingCode = await prisma.mRincianKegiatan.findFirst({
      where: { kd_rincian: kd_rincian }
    });

    if (existingCode) {
      return NextResponse.json({ error: `Kode Sub Komponen '${kd_rincian}' sudah digunakan. Silakan gunakan kode lain.` }, { status: 400 });
    }

    const created = await prisma.mRincianKegiatan.create({
      data: {
        kd_komponen,
        kd_rincian,
        nm_rincian
      }
    });

    return NextResponse.json({ message: "Data Sub Komponen berhasil ditambahkan", data: created });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server" }, { status: 500 });
  }
}

// UPDATE Rincian Kegiatan
export async function PUT(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth || auth.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { id, kd_komponen, kd_rincian, nm_rincian } = body;

    if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });
    if (!kd_komponen || !kd_rincian || !nm_rincian) {
      return NextResponse.json({ error: "Semua kolom wajib diisi" }, { status: 400 });
    }

    // Cek apakah kode rincian sudah digunakan oleh ID lain
    const existingCode = await prisma.mRincianKegiatan.findFirst({
      where: { 
        kd_rincian: kd_rincian,
        id: { not: parseInt(id) }
      }
    });

    if (existingCode) {
      return NextResponse.json({ error: `Kode Sub Komponen '${kd_rincian}' sudah digunakan oleh data lain.` }, { status: 400 });
    }

    const updated = await prisma.mRincianKegiatan.update({
      where: { id: parseInt(id) },
      data: {
        kd_komponen,
        kd_rincian,
        nm_rincian
      }
    });

    return NextResponse.json({ message: "Data berhasil diperbarui", data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server" }, { status: 500 });
  }
}

// DELETE Rincian Kegiatan
export async function DELETE(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth || auth.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });

    await prisma.mRincianKegiatan.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ message: "Data Sub Komponen berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server saat menghapus data" }, { status: 500 });
  }
}
