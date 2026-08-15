export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  const user = getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const bulan = searchParams.get("bulan");
  const tahun = searchParams.get("tahun");
  const kd_upt = searchParams.get("kd_upt") || user.kd_upt;

  const where: Record<string, unknown> = {};
  if (bulan) where.bulan = parseInt(bulan);
  if (tahun) where.tahun = parseInt(tahun);
  if (user.role !== "superadmin") where.kd_upt = user.kd_upt;
  else if (kd_upt) where.kd_upt = kd_upt;

  const data = await prisma.bKU.findMany({
    where,
    orderBy: [{ tgl_transaksi: "asc" }, { id: "asc" }],
  });

  // Hitung saldo kumulatif
  let saldo = 0;
  const withSaldo = data.map((row) => {
    saldo = saldo + (row.debet || 0) - (row.kredit || 0);
    return { ...row, saldo };
  });

  // Rekap
  const totalDebet = data.reduce((s, r) => s + (r.debet || 0), 0);
  const totalKredit = data.reduce((s, r) => s + (r.kredit || 0), 0);

  return NextResponse.json({ data: withSaldo, totalDebet, totalKredit, saldoAkhir: saldo });
}

export async function POST(req: Request) {
  const user = getUserFromRequest(req);
  if (!user || !["superadmin", "bendahara"].includes(user.role))
    return NextResponse.json({ error: "Forbidden - Hanya Bendahara yang dapat input BKU" }, { status: 403 });

  const body = await req.json();
  const kd_upt = user.role === "superadmin" ? body.kd_upt : user.kd_upt;

  const tgl = body.tgl_transaksi ? new Date(body.tgl_transaksi) : new Date();
  const bulan = tgl.getMonth() + 1;
  const tahun = tgl.getFullYear();

  const bku = await prisma.bKU.create({
    data: {
      kd_upt: kd_upt || "",
      sp2d_id: body.sp2d_id ? parseInt(body.sp2d_id) : null,
      no_bukti: body.no_bukti,
      tgl_transaksi: tgl,
      uraian: body.uraian,
      debet: body.debet ? parseFloat(body.debet) : 0,
      kredit: body.kredit ? parseFloat(body.kredit) : 0,
      kd_rek6: body.kd_rek6,
      jenis: body.jenis || "kas",
      bulan,
      tahun,
      dibuat_oleh: user.id,
    },
  });

  return NextResponse.json({ data: bku }, { status: 201 });
}
