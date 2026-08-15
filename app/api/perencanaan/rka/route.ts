export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest, isUptUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const tahun_id = searchParams.get("tahun_id");
  const kd_upt = searchParams.get("kd_upt") || user.kd_upt;

  const where: Record<string, unknown> = {};
  if (tahun_id) where.tahun_id = parseInt(tahun_id);
  if (user.role !== "superadmin" && kd_upt) where.kd_upt = kd_upt;
  else if (user.role === "superadmin" && kd_upt) where.kd_upt = kd_upt;

  const data = await prisma.rKA.findMany({
    where,
    include: { tahun: true, rincian: true },
    orderBy: { tgl_dibuat: "desc" },
  });

  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const user = getUserFromRequest(req);
  if (!user || !["superadmin", "perencana"].includes(user.role))
    return NextResponse.json({ error: "Forbidden - Hanya Perencana yang dapat membuat RKA" }, { status: 403 });

  const body = await req.json();
  const kd_upt = user.role === "superadmin" ? body.kd_upt : user.kd_upt;

  const rka = await prisma.rKA.create({
    data: {
      kd_upt: kd_upt || "",
      tahun_id: body.tahun_id,
      no_rka: body.no_rka,
      kd_program: body.kd_program,
      kd_kegiatan: body.kd_kegiatan,
      kd_sub_kegiatan: body.kd_sub_kegiatan,
      nm_kegiatan: body.nm_kegiatan,
      pagu: body.pagu,
      status: "draft",
      keterangan: body.keterangan,
      dibuat_oleh: user.id,
      rincian: body.rincian
        ? {
            createMany: {
              data: body.rincian.map((r: Record<string, unknown>) => ({
                kd_rek6: r.kd_rek6,
                uraian: r.uraian,
                volume: r.volume,
                satuan: r.satuan,
                harga_satuan: r.harga_satuan,
                jumlah: r.jumlah,
                kd_dana: r.kd_dana,
              })),
            },
          }
        : undefined,
    },
    include: { rincian: true },
  });

  return NextResponse.json({ data: rka }, { status: 201 });
}

export async function PUT(req: Request) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const rka = await prisma.rKA.findUnique({ where: { id: body.id } });
  if (!rka) return NextResponse.json({ error: "RKA tidak ditemukan" }, { status: 404 });

  if (!isUptUser(user, rka.kd_upt))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // KPA bisa approve/reject
  if (body.action === "setujui") {
    if (!["superadmin", "kpa"].includes(user.role))
      return NextResponse.json({ error: "Hanya KPA yang dapat menyetujui RKA" }, { status: 403 });

    const updated = await prisma.rKA.update({
      where: { id: body.id },
      data: { status: "disetujui", disetujui_oleh: user.id, tgl_disetujui: new Date() },
    });
    return NextResponse.json({ data: updated });
  }

  if (body.action === "tolak") {
    if (!["superadmin", "kpa"].includes(user.role))
      return NextResponse.json({ error: "Hanya KPA yang dapat menolak RKA" }, { status: 403 });

    const updated = await prisma.rKA.update({
      where: { id: body.id },
      data: { status: "ditolak", keterangan: body.keterangan },
    });
    return NextResponse.json({ data: updated });
  }

  if (body.action === "ajukan") {
    const updated = await prisma.rKA.update({
      where: { id: body.id },
      data: { status: "diajukan" },
    });
    return NextResponse.json({ data: updated });
  }

  // Update biasa
  const updated = await prisma.rKA.update({
    where: { id: body.id },
    data: {
      no_rka: body.no_rka,
      kd_program: body.kd_program,
      kd_kegiatan: body.kd_kegiatan,
      nm_kegiatan: body.nm_kegiatan,
      pagu: body.pagu,
      keterangan: body.keterangan,
    },
  });
  return NextResponse.json({ data: updated });
}
