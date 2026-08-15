export const runtime = "nodejs";

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { LEVEL_TO_ROLE, BludRole } from "@/lib/auth";

const JWT_SECRET = process.env.JWT_SECRET || "rahasia-blud-keuangan";
const API_KEY = process.env.API_KEY || "";

function validateApiKey(req: Request) {
  const apiKey = req.headers.get("x-api-key");
  // Jika API_KEY kosong di env, skip validasi (dev mode)
  if (API_KEY && (!apiKey || apiKey !== API_KEY)) {
    return NextResponse.json(
      { success: false, message: "Unauthorized - Invalid API Key" },
      { status: 401 }
    );
  }
  return null;
}

export async function POST(req: Request) {
  const unauthorized = validateApiKey(req);
  if (unauthorized) return unauthorized;

  try {
    const { username, pasword, tahun } = await req.json();

    if (!username || !pasword) {
      return NextResponse.json(
        { error: "Username dan password wajib diisi" },
        { status: 400 }
      );
    }

    // Cari user di tabel admin
    const admin = await prisma.admin.findFirst({
      where: { username, status: 1, block: 0 },
    });

    if (!admin) {
      return NextResponse.json(
        { error: "Username tidak ditemukan atau akun tidak aktif" },
        { status: 404 }
      );
    }

    // Verifikasi password (support bcrypt & plain text untuk migrasi)
    let validPassword = false;
    const storedPass = admin.password || "";

    if (storedPass.startsWith("$2")) {
      // bcrypt hash
      validPassword = await bcrypt.compare(pasword, storedPass);
    } else {
      // plain text (legacy) - bandingkan langsung
      validPassword = pasword === storedPass;
    }

    if (!validPassword) {
      return NextResponse.json({ error: "Password salah" }, { status: 401 });
    }

    const level = admin.level ?? 5;
    const role: BludRole = LEVEL_TO_ROLE[level] ?? "bendahara";

    // Generate JWT token
    const tokenPayload = {
      id: admin.id,
      nama: admin.nama ?? "",
      username: admin.username ?? "",
      level,
      role,
      kd_upt: admin.unit ?? null,
      unit: admin.unit ?? null,
      email: admin.email ?? null,
      tahun: tahun || new Date().getFullYear().toString(),
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "8h" });

    // Update tgl_login
    await prisma.admin.update({
      where: { id: admin.id },
      data: { tgl_login: new Date() },
    });

    const response = NextResponse.json({
      message: "Login berhasil",
      user: tokenPayload,
      token,
    });

    response.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8, // 8 jam
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
