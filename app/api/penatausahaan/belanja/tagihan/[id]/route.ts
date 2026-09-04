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

    const tagihan = await prisma.tagihan.findUnique({
      where: { id },
      include: {
        rincian: true,
        penerimaan_barang: {
          include: {
            pengadaan: {
              include: {
                rincian: true
              }
            }
          }
        },
        permintaan_belanja: {
          include: {
            rincian: true
          }
        }
      }
    });

    if (!tagihan) {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ data: tagihan });
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
      no_tagihan,
      tgl_tagihan,
      uraian,
      nilai_tagihan,
      nm_vendor,
    } = body;

    const existing = await prisma.tagihan.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    if (existing.status === "lunas") {
      return NextResponse.json({ error: "Tagihan sudah dibukukan sebagai pengeluaran, tidak dapat diedit." }, { status: 400 });
    }

    const updated = await prisma.tagihan.update({
      where: { id },
      data: {
        no_tagihan,
        tgl_tagihan: new Date(tgl_tagihan),
        keterangan: uraian,
        nm_vendor: nm_vendor || null,
        nilai_tagihan: Number(nilai_tagihan || 0)
      }
    });

    return NextResponse.json({ message: "Data Tagihan berhasil diupdate", data: updated });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Nomor Tagihan sudah ada" }, { status: 400 });
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

    const tagihan = await prisma.tagihan.findUnique({
      where: { id },
      include: {
        penerimaan_barang: {
          include: {
            pengadaan: true
          }
        },
        permintaan_belanja: true
      }
    });

    if (!tagihan) {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    }
    if (tagihan.status === "lunas") {
      return NextResponse.json({ error: "Tagihan sudah dibukukan sebagai pengeluaran, tidak dapat dihapus." }, { status: 400 });
    }

    // TODO: Cek apakah tagihan sudah masuk SPP (jika ada tabel SPP)
    // if (checkSPP) return error;


    await prisma.$transaction(async (tx) => {
      await tx.tagihan.delete({
        where: { id }
      });

      if (tagihan.permintaan_belanja_id && tagihan.permintaan_belanja) {
        const newStatus = tagihan.permintaan_belanja.jenis_permintaan === "pengadaan" ? "diterima" : "draft";
        await tx.permintaanBelanja.update({
          where: { id: tagihan.permintaan_belanja_id },
          data: { status: newStatus }
        });
      }
      
      if (tagihan.penerimaan_barang?.pengadaan?.permintaan_belanja_id) {
        await tx.permintaanBelanja.update({
          where: { id: tagihan.penerimaan_barang.pengadaan.permintaan_belanja_id },
          data: { status: "diterima" }
        });
      }
    });

    return NextResponse.json({ message: "Data Tagihan berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
