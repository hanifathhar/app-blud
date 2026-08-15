export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  const data = await prisma.tahunAnggaran.findMany({ orderBy: { tahun: "desc" } });
  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== "superadmin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const data = await prisma.tahunAnggaran.create({
    data: { tahun: body.tahun, status: body.status || "aktif", keterangan: body.keterangan },
  });
  return NextResponse.json({ data }, { status: 201 });
}

export async function PUT(req: Request) {
  const user = getUserFromRequest(req);
  if (!user || user.role !== "superadmin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const data = await prisma.tahunAnggaran.update({
    where: { id: body.id },
    data: { status: body.status, keterangan: body.keterangan },
  });
  return NextResponse.json({ data });
}
