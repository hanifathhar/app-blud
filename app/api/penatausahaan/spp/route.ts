export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, isUptUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const kd_upt = searchParams.get("kd_upt") || user.kd_upt;
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (user.role !== "superadmin") where.kd_upt = user.kd_upt;
  else if (kd_upt) where.kd_upt = kd_upt;

  const data = await prisma.sPP.findMany({
    where,
    include: {
      dpa: { select: { no_dpa: true, nm_kegiatan: true } },
      spm: { select: { id: true, status: true, no_spm: true } },
    },
    orderBy: { tgl_dibuat: "desc" },
  });

  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const user = getUserFromRequest(req);
  if (!user || !["superadmin", "keuangan", "bendahara"].includes(user.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const kd_upt = user.role === "superadmin" ? body.kd_upt : user.kd_upt;

  const spp = await prisma.sPP.create({
    data: {
      kd_upt: kd_upt || "",
      dpa_id: body.dpa_id ? parseInt(body.dpa_id) : null,
      no_spp: body.no_spp,
      tgl_spp: body.tgl_spp ? new Date(body.tgl_spp) : null,
      jenis_spp: body.jenis_spp,
      uraian: body.uraian,
      jumlah: body.jumlah ? parseFloat(body.jumlah) : null,
      status: "draft",
      dibuat_oleh: user.id,
      keterangan: body.keterangan,
    },
  });

  return NextResponse.json({ data: spp }, { status: 201 });
}

export async function PUT(req: Request) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const spp = await prisma.sPP.findUnique({ where: { id: body.id } });
  if (!spp) return NextResponse.json({ error: "SPP tidak ditemukan" }, { status: 404 });
  if (!isUptUser(user, spp.kd_upt))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (body.action === "ajukan") {
    const updated = await prisma.sPP.update({ where: { id: body.id }, data: { status: "diajukan" } });
    return NextResponse.json({ data: updated });
  }

  if (body.action === "verifikasi") {
    if (!["superadmin", "keuangan"].includes(user.role))
      return NextResponse.json({ error: "Hanya Keuangan yang dapat memverifikasi SPP" }, { status: 403 });
    const updated = await prisma.sPP.update({
      where: { id: body.id },
      data: { status: "diverifikasi", diverifikasi_oleh: user.id },
    });
    return NextResponse.json({ data: updated });
  }

  if (body.action === "setujui") {
    if (!["superadmin", "kpa"].includes(user.role))
      return NextResponse.json({ error: "Hanya KPA yang dapat menyetujui SPP" }, { status: 403 });
    const updated = await prisma.sPP.update({
      where: { id: body.id },
      data: { status: "disetujui" },
    });
    return NextResponse.json({ data: updated });
  }

  if (body.action === "tolak") {
    const updated = await prisma.sPP.update({
      where: { id: body.id },
      data: { status: "ditolak", keterangan: body.keterangan },
    });
    return NextResponse.json({ data: updated });
  }

  const updated = await prisma.sPP.update({
    where: { id: body.id },
    data: {
      no_spp: body.no_spp,
      tgl_spp: body.tgl_spp ? new Date(body.tgl_spp) : undefined,
      jenis_spp: body.jenis_spp,
      uraian: body.uraian,
      jumlah: body.jumlah,
      keterangan: body.keterangan,
    },
  });
  return NextResponse.json({ data: updated });
}
