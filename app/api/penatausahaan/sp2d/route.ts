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

  const data = await prisma.sP2D.findMany({
    where,
    include: {
      spm: { include: { spp: { select: { no_spp: true, jenis_spp: true, uraian: true } } } },
    },
    orderBy: { tgl_dibuat: "desc" },
  });

  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const user = getUserFromRequest(req);
  if (!user || !["superadmin", "bendahara", "keuangan"].includes(user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();

  const spm = await prisma.sPM.findUnique({ where: { id: body.spm_id } });
  if (!spm || spm.status !== "diterbitkan")
    return NextResponse.json({ error: "SPM belum diterbitkan" }, { status: 400 });

  const kd_upt = user.role === "superadmin" ? body.kd_upt || spm.kd_upt : user.kd_upt || "";

  const sp2d = await prisma.sP2D.create({
    data: {
      spm_id: body.spm_id,
      kd_upt,
      no_sp2d: body.no_sp2d,
      tgl_sp2d: body.tgl_sp2d ? new Date(body.tgl_sp2d) : null,
      jumlah: body.jumlah || spm.jumlah,
      bank: body.bank,
      no_rekening: body.no_rekening,
      status: "proses",
      dicatat_oleh: user.id,
      keterangan: body.keterangan,
    },
  });

  return NextResponse.json({ data: sp2d }, { status: 201 });
}

export async function PUT(req: Request) {
  const user = getUserFromRequest(req);
  if (!user || !["superadmin", "bendahara", "keuangan"].includes(user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const updated = await prisma.sP2D.update({
    where: { id: body.id },
    data: {
      status: body.status,
      tgl_sp2d: body.tgl_sp2d ? new Date(body.tgl_sp2d) : undefined,
      keterangan: body.keterangan,
    },
  });
  return NextResponse.json({ data: updated });
}
