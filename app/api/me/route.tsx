export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LEVEL_TO_ROLE, ROLE_LABELS } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = getUserFromRequest(req);

    if (!user) {
      return NextResponse.json(
        { error: "Token tidak valid atau tidak ditemukan" },
        { status: 401 }
      );
    }

    // Ambil data fresh dari DB
    const admin = await prisma.admin.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        nama: true,
        username: true,
        level: true,
        unit: true,
        email: true,
        no_telp: true,
        status: true,
        tgl_login: true,
      },
    });

    if (!admin || admin.status !== 1) {
      return NextResponse.json(
        { error: "User tidak ditemukan atau tidak aktif" },
        { status: 404 }
      );
    }

    const level = admin.level ?? 5;
    const role = LEVEL_TO_ROLE[level] ?? "bendahara";

    // Ambil info UPT jika bukan superadmin
    let uptInfo = null;
    if (admin.unit && role !== "superadmin") {
      uptInfo = await prisma.msUpt.findFirst({
        where: { kd_upt: admin.unit.trim() },
        select: { kd_upt: true, nm_upt: true, type: true, kabupaten: true },
      });
    }

    return NextResponse.json({
      user: {
        id: admin.id,
        nama: admin.nama,
        username: admin.username,
        level,
        role,
        roleLabel: ROLE_LABELS[role],
        kd_upt: admin.unit,
        unit: admin.unit,
        email: admin.email,
        no_telp: admin.no_telp,
        tgl_login: admin.tgl_login,
        upt: uptInfo,
        tahun: user.tahun,
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Terjadi kesalahan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
