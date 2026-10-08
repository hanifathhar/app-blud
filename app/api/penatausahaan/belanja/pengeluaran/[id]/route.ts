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
          include: { 
            rincian: true,
            potongan: true,
          },
        },
        rincian: true,
        potongan: true,
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

    if (existing.pengesahan === 1) {
      return NextResponse.json({ error: "Pengeluaran sudah disahkan dalam LPJ dan terkunci. Batalkan pengesahan LPJ terlebih dahulu sebelum mengubah data." }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const peng = await tx.pengeluaran.update({
        where: { id: pengeluaranId },
        data: {
          tgl_pengeluaran: new Date(tgl_pengeluaran),
          keterangan: keterangan || existing.keterangan,
        },
      });

      // Update potongan jika ada
      if (Array.isArray(body.potongan)) {
        for (const p of body.potongan) {
          if (p.id) {
            const ntpn = (p.no_ntpn || "").trim();
            const tglSetor = p.tgl_setor ? new Date(p.tgl_setor) : (ntpn ? new Date(tgl_pengeluaran) : null);
            const statusSetor = ntpn ? "disetor" : (p.status_setor || "belum_disetor");

            await tx.potonganPengeluaran.updateMany({
              where: {
                id: p.id,
                pengeluaran_id: pengeluaranId,
              },
              data: {
                no_ntpn: ntpn || null,
                tgl_setor: tglSetor,
                status_setor: statusSetor,
                keterangan: p.keterangan,
              },
            });
          }
        }
      }

      return peng;
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

    if (pengeluaran.pengesahan === 1) {
      return NextResponse.json({ error: "Pengeluaran sudah disahkan dalam LPJ dan terkunci. Batalkan pengesahan LPJ terlebih dahulu sebelum menghapus data." }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // Hapus potongan pengeluaran
      await tx.potonganPengeluaran.deleteMany({ where: { pengeluaran_id: pengeluaranId } });

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
