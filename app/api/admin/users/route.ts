export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function GET(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== "superadmin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const kd_upt = searchParams.get("kd_upt");
    const q = searchParams.get("q") || "";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10"));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (kd_upt) where.unit = kd_upt;
    if (q) {
      where.OR = [
        { nama: { contains: q, mode: "insensitive" } },
        { username: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, users] = await prisma.$transaction([
      prisma.admin.count({ where }),
      prisma.admin.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true, nama: true, username: true,
          level: true, status: true, unit: true,
          email: true, no_telp: true, tgl_login: true,
        },
        orderBy: [{ unit: "asc" }, { level: "asc" }],
      })
    ]);

    return NextResponse.json({
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("GET users error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== "superadmin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();

    // Cek username unik
    const existing = await prisma.admin.findFirst({ where: { username: body.username } });
    if (existing)
      return NextResponse.json({ error: "Username sudah digunakan" }, { status: 409 });

    const hashedPassword = await bcrypt.hash(body.password, 10);

    const newUser = await prisma.admin.create({
      data: {
        nama: body.nama,
        username: body.username,
        password: hashedPassword,
        level: parseInt(body.level),
        status: 1,
        block: 0,
        unit: body.unit || null,
        email: body.email || null,
        no_telp: body.no_telp || null,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userData } = newUser;
    return NextResponse.json({ data: userData }, { status: 201 });
  } catch (error: any) {
    console.error("POST users error:", error);
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server saat menyimpan pengguna" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== "superadmin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();

    const updateData: Record<string, unknown> = {
      nama: body.nama,
      level: body.level ? parseInt(body.level) : undefined,
      status: body.status !== undefined ? parseInt(body.status) : undefined,
      unit: body.unit || null,
      email: body.email || null,
      no_telp: body.no_telp || null,
      block: body.block !== undefined ? parseInt(body.block) : undefined,
    };

    if (body.password) {
      updateData.password = await bcrypt.hash(body.password, 10);
    }

    // Hapus undefined
    Object.keys(updateData).forEach((k) => updateData[k] === undefined && delete updateData[k]);

    const updated = await prisma.admin.update({
      where: { id: body.id },
      data: updateData,
      select: {
        id: true, nama: true, username: true,
        level: true, status: true, unit: true,
        email: true, no_telp: true,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    console.error("PUT users error:", error);
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server saat memperbarui pengguna" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user || user.role !== "superadmin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });

    await prisma.admin.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: "User berhasil dihapus" });
  } catch (error: any) {
    console.error("DELETE users error:", error);
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server saat menghapus pengguna" }, { status: 500 });
  }
}
