import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

// GET all Sumber Dana
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
      where.sumdan = { contains: q, mode: "insensitive" };
    }

    const [data, total] = await Promise.all([
      prisma.msDana.findMany({
        where,
        skip,
        take: limit,
        orderBy: { sumdan: "asc" }
      }),
      prisma.msDana.count({ where })
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

// CREATE new Sumber Dana
export async function POST(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth || auth.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { sumdan } = body;

    if (!sumdan) {
      return NextResponse.json({ error: "Sumber Dana wajib diisi" }, { status: 400 });
    }

    // Cek apakah sumber dana sudah digunakan
    const existingData = await prisma.msDana.findFirst({
      where: { 
        sumdan: {
          equals: sumdan,
          mode: "insensitive"
        }
      }
    });

    if (existingData) {
      return NextResponse.json({ error: `Sumber Dana '${sumdan}' sudah digunakan. Silakan gunakan nama lain.` }, { status: 400 });
    }

    const created = await prisma.msDana.create({
      data: {
        sumdan
      }
    });

    return NextResponse.json({ message: "Data Sumber Dana berhasil ditambahkan", data: created });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server" }, { status: 500 });
  }
}

// UPDATE Sumber Dana
export async function PUT(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth || auth.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { id, sumdan } = body;

    if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });
    if (!sumdan) {
      return NextResponse.json({ error: "Sumber Dana wajib diisi" }, { status: 400 });
    }

    // Cek apakah sumber dana sudah digunakan oleh ID lain
    const existingData = await prisma.msDana.findFirst({
      where: { 
        sumdan: {
          equals: sumdan,
          mode: "insensitive"
        },
        id: { not: parseInt(id) }
      }
    });

    if (existingData) {
      return NextResponse.json({ error: `Sumber Dana '${sumdan}' sudah digunakan oleh data lain.` }, { status: 400 });
    }

    const updated = await prisma.msDana.update({
      where: { id: parseInt(id) },
      data: {
        sumdan
      }
    });

    return NextResponse.json({ message: "Data berhasil diperbarui", data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server" }, { status: 500 });
  }
}

// DELETE Sumber Dana
export async function DELETE(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth || auth.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });

    await prisma.msDana.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({ message: "Data Sumber Dana berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server saat menghapus data" }, { status: 500 });
  }
}
