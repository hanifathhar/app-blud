import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

// GET all UKM
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
        { kd_ukm: { contains: q, mode: "insensitive" } },
        { nm_ukm: { contains: q, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.mUkm.findMany({
        where,
        skip,
        take: limit,
        orderBy: { kd_ukm: "asc" }
      }),
      prisma.mUkm.count({ where })
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

// CREATE new UKM
export async function POST(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth || auth.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { kd_ukm, nm_ukm } = body;

    if (!kd_ukm || !nm_ukm) {
      return NextResponse.json({ error: "Kode dan Nama UKM wajib diisi" }, { status: 400 });
    }

    // Cek apakah kode UKM sudah digunakan
    const existingCode = await prisma.mUkm.findFirst({
      where: { kd_ukm: kd_ukm }
    });

    if (existingCode) {
      return NextResponse.json({ error: `Kode UKM '${kd_ukm}' sudah digunakan. Silakan gunakan kode lain.` }, { status: 400 });
    }

    const created = await prisma.mUkm.create({
      data: {
        kd_ukm,
        nm_ukm
      }
    });

    return NextResponse.json({ message: "Data UKM berhasil ditambahkan", data: created });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server" }, { status: 500 });
  }
}

// UPDATE UKM
export async function PUT(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth || auth.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { id, kd_ukm, nm_ukm } = body;

    if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });
    if (!kd_ukm || !nm_ukm) {
      return NextResponse.json({ error: "Kode dan Nama UKM wajib diisi" }, { status: 400 });
    }

    // Cek apakah kode UKM sudah digunakan oleh ID lain
    const existingCode = await prisma.mUkm.findFirst({
      where: { 
        kd_ukm: kd_ukm,
        id: { not: parseInt(id) }
      }
    });

    if (existingCode) {
      return NextResponse.json({ error: `Kode UKM '${kd_ukm}' sudah digunakan oleh data lain.` }, { status: 400 });
    }

    const updated = await prisma.mUkm.update({
      where: { id: parseInt(id) },
      data: {
        kd_ukm,
        nm_ukm
      }
    });

    return NextResponse.json({ message: "Data berhasil diperbarui", data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server" }, { status: 500 });
  }
}

// DELETE UKM
export async function DELETE(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth || auth.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });

    await prisma.mUkm.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ message: "Data UKM berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server saat menghapus data" }, { status: 500 });
  }
}
