import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

// GET all SPM
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
        { nm_spm: { contains: q, mode: "insensitive" } },
      ];
      // Coba parse q sebagai angka untuk pencarian kode
      const qNum = parseInt(q);
      if (!isNaN(qNum)) {
        where.OR.push({ kd_spm: qNum });
      }
    }

    const [data, total] = await Promise.all([
      prisma.msSpm.findMany({
        where,
        skip,
        take: limit,
        orderBy: { kd_spm: "asc" }
      }),
      prisma.msSpm.count({ where })
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

// CREATE new SPM
export async function POST(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth || auth.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { kd_spm, nm_spm } = body;

    if (!kd_spm || !nm_spm) {
      return NextResponse.json({ error: "Kode dan Nama SPM wajib diisi" }, { status: 400 });
    }

    const kodeSpmNum = parseInt(kd_spm, 10);
    if (isNaN(kodeSpmNum)) {
      return NextResponse.json({ error: "Kode SPM harus berupa angka" }, { status: 400 });
    }

    // Cek apakah kode SPM sudah digunakan
    const existingCode = await prisma.msSpm.findFirst({
      where: { kd_spm: kodeSpmNum }
    });

    if (existingCode) {
      return NextResponse.json({ error: `Kode SPM '${kodeSpmNum}' sudah digunakan. Silakan gunakan kode lain.` }, { status: 400 });
    }

    const created = await prisma.msSpm.create({
      data: {
        kd_spm: kodeSpmNum,
        nm_spm
      }
    });

    return NextResponse.json({ message: "Data SPM berhasil ditambahkan", data: created });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server" }, { status: 500 });
  }
}

// UPDATE SPM
export async function PUT(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth || auth.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { id, kd_spm, nm_spm } = body;

    if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });
    if (!kd_spm || !nm_spm) {
      return NextResponse.json({ error: "Kode dan Nama SPM wajib diisi" }, { status: 400 });
    }

    const kodeSpmNum = parseInt(kd_spm, 10);
    if (isNaN(kodeSpmNum)) {
      return NextResponse.json({ error: "Kode SPM harus berupa angka" }, { status: 400 });
    }

    // Cek apakah kode SPM sudah digunakan oleh ID lain
    const existingCode = await prisma.msSpm.findFirst({
      where: { 
        kd_spm: kodeSpmNum,
        id: { not: parseInt(id) }
      }
    });

    if (existingCode) {
      return NextResponse.json({ error: `Kode SPM '${kodeSpmNum}' sudah digunakan oleh data lain.` }, { status: 400 });
    }

    const updated = await prisma.msSpm.update({
      where: { id: parseInt(id) },
      data: {
        kd_spm: kodeSpmNum,
        nm_spm
      }
    });

    return NextResponse.json({ message: "Data berhasil diperbarui", data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server" }, { status: 500 });
  }
}

// DELETE SPM
export async function DELETE(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth || auth.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });

    await prisma.msSpm.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ message: "Data SPM berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server saat menghapus data" }, { status: 500 });
  }
}
