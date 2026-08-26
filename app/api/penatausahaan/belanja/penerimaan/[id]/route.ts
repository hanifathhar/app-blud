import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

    const penerimaan = await prisma.penerimaanBarang.findUnique({
      where: { id },
      include: {
        pengadaan: {
          include: {
            rincian: true,
            permintaan_belanja: true
          }
        }
      }
    });

    if (!penerimaan) {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ data: penerimaan });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

    const body = await req.json();
    const {
      no_bast,
      tgl_bast,
      uraian,
    } = body;

    const penerimaan = await prisma.penerimaanBarang.findUnique({
      where: { id },
      include: { pengadaan: true }
    });

    if (!penerimaan) {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    }

    const checkTagihan = await prisma.tagihan.findFirst({
      where: {
        OR: [
          { penerimaan_barang_id: id },
          { permintaan_belanja_id: penerimaan.pengadaan?.permintaan_belanja_id || -1 }
        ]
      }
    });

    if (checkTagihan) {
      return NextResponse.json({ error: "Tidak dapat mengubah BAST yang sudah memiliki Tagihan" }, { status: 400 });
    }

    const updated = await prisma.penerimaanBarang.update({
      where: { id },
      data: {
        no_bast,
        tgl_bast: new Date(tgl_bast),
        keterangan: uraian,
      }
    });

    return NextResponse.json({ message: "Data BAST berhasil diupdate", data: updated });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Nomor BAST sudah ada" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

    const penerimaan = await prisma.penerimaanBarang.findUnique({
      where: { id },
      include: { pengadaan: true }
    });

    if (!penerimaan) {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    }

    // Cek apakah sudah ada tagihan untuk penerimaan ini atau permintaan belanjanya
    const checkTagihan = await prisma.tagihan.findFirst({
      where: {
        OR: [
          { penerimaan_barang_id: id },
          { permintaan_belanja_id: penerimaan.pengadaan?.permintaan_belanja_id || -1 }
        ]
      }
    });

    if (checkTagihan) {
       return NextResponse.json({ error: "Tidak dapat menghapus BAST yang sudah memiliki Tagihan" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // kembalikan status pengadaan ke proses
      if (penerimaan.pengadaan_id) {
        const p = await tx.pengadaan.update({
          where: { id: penerimaan.pengadaan_id },
          data: { status: "proses" }
        });

        if (p.permintaan_belanja_id) {
          await tx.permintaanBelanja.update({
            where: { id: p.permintaan_belanja_id },
            data: { status: "diproses_pengadaan" }
          });
        }
      }

      await tx.penerimaanBarang.delete({
        where: { id }
      });
    });

    return NextResponse.json({ message: "Data BAST berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
