import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const pengeluaranId = parseInt(id);
    if (isNaN(pengeluaranId)) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

    const pengeluaran = await prisma.pengeluaran.findUnique({
      where: { id: pengeluaranId },
      include: {
        tagihan: {
          include: { rincian: true },
        },
        rincian: true,
      },
    });

    if (!pengeluaran) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });

    return NextResponse.json({ data: pengeluaran });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const pengeluaranId = parseInt(id);
    if (isNaN(pengeluaranId)) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

    const body = await req.json();
    const { tgl_pengeluaran, keterangan } = body;

    if (!tgl_pengeluaran) {
      return NextResponse.json({ error: "Tanggal pengeluaran wajib diisi" }, { status: 400 });
    }

    const existing = await prisma.pengeluaran.findUnique({ where: { id: pengeluaranId } });
    if (!existing) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });

    const updated = await prisma.pengeluaran.update({
      where: { id: pengeluaranId },
      data: {
        tgl_pengeluaran: new Date(tgl_pengeluaran),
        keterangan: keterangan || existing.keterangan,
      },
    });

    return NextResponse.json({ message: "Data Pengeluaran berhasil diupdate", data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const pengeluaranId = parseInt(id);
    if (isNaN(pengeluaranId)) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

    const pengeluaran = await prisma.pengeluaran.findUnique({
      where: { id: pengeluaranId },
      include: { tagihan: true },
    });

    if (!pengeluaran) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      // Hapus rincian pengeluaran
      await tx.rincianPengeluaran.deleteMany({ where: { pengeluaran_id: pengeluaranId } });

      // Hapus pengeluaran
      await tx.pengeluaran.delete({ where: { id: pengeluaranId } });

      // Kembalikan status tagihan ke belum_dibayar
      if (pengeluaran.tagihan_id) {
        await tx.tagihan.update({
          where: { id: pengeluaran.tagihan_id },
          data: { status: "belum_dibayar" },
        });
      }
    });

    return NextResponse.json({ message: "Data Pengeluaran berhasil dihapus dan status tagihan dikembalikan" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
