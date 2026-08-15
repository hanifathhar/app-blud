export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const kd_upt = searchParams.get("kd_upt") || user.kd_upt;

  const where: Record<string, unknown> = {};
  if (user.role !== "superadmin") where.kd_upt = user.kd_upt;
  else if (kd_upt) where.kd_upt = kd_upt;

  const data = await prisma.sPM.findMany({
    where,
    include: {
      spp: { select: { no_spp: true, jenis_spp: true, uraian: true, jumlah: true } },
      sp2d: { select: { id: true, status: true, no_sp2d: true } },
    },
    orderBy: { tgl_dibuat: "desc" },
  });

  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const user = getUserFromRequest(req);
  if (!user || !["superadmin", "kpa"].includes(user.role))
    return NextResponse.json({ error: "Forbidden - Hanya KPA yang dapat menerbitkan SPM" }, { status: 403 });

  const body = await req.json();

  // Cek SPP harus sudah disetujui
  const spp = await prisma.sPP.findUnique({ where: { id: body.spp_id } });
  if (!spp || spp.status !== "disetujui")
    return NextResponse.json({ error: "SPP belum disetujui" }, { status: 400 });

  const kd_upt = user.role === "superadmin" ? body.kd_upt || spp.kd_upt : user.kd_upt || "";

  const spm = await prisma.sPM.create({
    data: {
      spp_id: body.spp_id,
      kd_upt,
      no_spm: body.no_spm,
      tgl_spm: body.tgl_spm ? new Date(body.tgl_spm) : null,
      jumlah: body.jumlah || spp.jumlah,
      status: "diterbitkan",
      diterbitkan_oleh: user.id,
      keterangan: body.keterangan,
    },
  });

  return NextResponse.json({ data: spm }, { status: 201 });
}

export async function PUT(req: Request) {
  const user = getUserFromRequest(req);
  if (!user || !["superadmin", "kpa"].includes(user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const updated = await prisma.sPM.update({
    where: { id: body.id },
    data: { status: body.status, keterangan: body.keterangan },
  });
  return NextResponse.json({ data: updated });
}
