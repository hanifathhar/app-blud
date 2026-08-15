import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

// GET all Sub Kegiatan
export async function GET(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const q = searchParams.get("q") || "";
    const program = searchParams.get("program") || "";
    const kegiatan = searchParams.get("kegiatan") || "";
    
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where: any = {
      AND: []
    };

    if (q) {
      where.AND.push({
        OR: [
          { kd_sub_kegiatan: { contains: q, mode: "insensitive" } },
          { nm_sub_kegiatan: { contains: q, mode: "insensitive" } },
        ]
      });
    }

    if (program) {
      where.AND.push({ kd_program: program });
    }

    if (kegiatan) {
      where.AND.push({ kd_kegiatan: kegiatan });
    }

    if (where.AND.length === 0) {
      delete where.AND;
    }

    const [data, total] = await Promise.all([
      prisma.mSubGiat.findMany({
        where,
        skip,
        take: limit,
        orderBy: { kd_sub_kegiatan: "asc" }
      }),
      prisma.mSubGiat.count({ where })
    ]);

    const mappedData = data.map(d => ({
      ...d,
      kd_sub_kegiatan: d.kd_sub_kegiatan?.trim() || "",
      kd_kegiatan: d.kd_kegiatan?.trim() || "",
      kd_program: d.kd_program?.trim() || "",
    }));

    return NextResponse.json({ 
      data: mappedData, 
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

// CREATE new Sub Kegiatan
export async function POST(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth || auth.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { kd_sub_kegiatan, kd_kegiatan, kd_program, nm_sub_kegiatan } = body;

    if (!kd_sub_kegiatan || !kd_kegiatan || !kd_program || !nm_sub_kegiatan) {
      return NextResponse.json({ error: "Semua kolom wajib diisi" }, { status: 400 });
    }

    // Cek apakah kode sub kegiatan sudah digunakan
    const existingCode = await prisma.mSubGiat.findFirst({
      where: { kd_sub_kegiatan: kd_sub_kegiatan }
    });

    if (existingCode) {
      return NextResponse.json({ error: `Kode Sub Kegiatan '${kd_sub_kegiatan}' sudah digunakan. Silakan gunakan kode lain.` }, { status: 400 });
    }

    const created = await prisma.mSubGiat.create({
      data: {
        kd_sub_kegiatan,
        kd_kegiatan,
        kd_program,
        nm_sub_kegiatan
      }
    });

    return NextResponse.json({ message: "Data Sub Kegiatan berhasil ditambahkan", data: created });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server" }, { status: 500 });
  }
}

// UPDATE Sub Kegiatan
export async function PUT(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth || auth.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { id, kd_sub_kegiatan, kd_kegiatan, kd_program, nm_sub_kegiatan } = body;

    if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });
    if (!kd_sub_kegiatan || !kd_kegiatan || !kd_program || !nm_sub_kegiatan) {
      return NextResponse.json({ error: "Semua kolom wajib diisi" }, { status: 400 });
    }

    // Cek apakah kode sub kegiatan sudah digunakan oleh ID lain
    const existingCode = await prisma.mSubGiat.findFirst({
      where: { 
        kd_sub_kegiatan: kd_sub_kegiatan,
        id: { not: parseInt(id) }
      }
    });

    if (existingCode) {
      return NextResponse.json({ error: `Kode Sub Kegiatan '${kd_sub_kegiatan}' sudah digunakan oleh data lain.` }, { status: 400 });
    }

    const updated = await prisma.mSubGiat.update({
      where: { id: parseInt(id) },
      data: {
        kd_sub_kegiatan,
        kd_kegiatan,
        kd_program,
        nm_sub_kegiatan
      }
    });

    return NextResponse.json({ message: "Data berhasil diperbarui", data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server" }, { status: 500 });
  }
}

// DELETE Sub Kegiatan
export async function DELETE(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth || auth.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });

    await prisma.mSubGiat.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ message: "Data Sub Kegiatan berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server saat menghapus data" }, { status: 500 });
  }
}
