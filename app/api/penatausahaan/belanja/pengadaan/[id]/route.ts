import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
    }

    const pengadaan = await prisma.pengadaan.findUnique({
      where: { id }
    });

    if (!pengadaan) {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    }

    if (pengadaan.status !== "proses") {
      return NextResponse.json({ error: "Hanya pengadaan berstatus proses yang dapat dihapus" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // Hapus Rincian Pengadaan (akan otomatis karena onDelete: Cascade di schema, tapi kalau tidak pastikan dihapus)
      // Kembalikan status Permintaan Belanja jika ada
      if (pengadaan.permintaan_belanja_id) {
        await tx.permintaanBelanja.update({
          where: { id: pengadaan.permintaan_belanja_id },
          data: { status: "draft" }
        });
      }

      await tx.pengadaan.delete({
        where: { id }
      });
    });

    return NextResponse.json({ message: "Data berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    if (isNaN(id)) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

    const body = await req.json();
    const {
      permintaan_belanja_id,
      no_kontrak,
      tgl_kontrak,
      nm_vendor,
      alamat_vendor,
      uraian,
      nilai_kontrak,
      tahun,
      rincian,
      no_permintaan,
      kd_ukm,
      kd_peruntukan,
      kd_komponen,
      kd_rincian,
      kd_sub_kegiatan,
      kd_spm,
    } = body;

    const existing = await prisma.pengadaan.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    if (existing.status !== "proses") return NextResponse.json({ error: "Hanya pengadaan berstatus proses yang dapat diubah" }, { status: 400 });

    let kd_upt = existing.kd_upt;
    if (body.kd_upt) kd_upt = body.kd_upt;

    if (permintaan_belanja_id && permintaan_belanja_id !== existing.permintaan_belanja_id) {
      const pb = await prisma.permintaanBelanja.findUnique({
        where: { id: Number(permintaan_belanja_id) }
      });
      if (pb && pb.kd_upt) kd_upt = pb.kd_upt;
    }

    const pengadaan = await prisma.$transaction(async (tx) => {
      // Delete old rincian
      await tx.rincianPengadaan.deleteMany({
        where: { pengadaan_id: id }
      });

      const p = await tx.pengadaan.update({
        where: { id },
        data: {
          permintaan_belanja_id: permintaan_belanja_id ? Number(permintaan_belanja_id) : null,
          no_kontrak,
          tgl_kontrak: new Date(tgl_kontrak),
          kd_upt,
          tahun,
          nm_vendor,
          alamat_vendor,
          uraian,
          nilai_kontrak: Number(nilai_kontrak || 0),
          no_permintaan,
          kd_ukm,
          kd_peruntukan,
          kd_komponen,
          kd_rincian: kd_rincian,
          kd_sub_kegiatan,
          kd_spm,
          rincian: {
            create: rincian.map((r: any) => ({
              kd_rek6: r.kd_rek6,
              nm_rek6: r.nm_rek6,
              uraian: r.uraian,
              kd_ukm: r.kd_ukm || kd_ukm,
              kd_peruntukan: r.kd_peruntukan || kd_peruntukan,
              kd_komponen: r.kd_komponen || kd_komponen,
              kd_rincian: r.kd_rincian || kd_rincian,
              kd_sub_kegiatan: r.kd_sub_kegiatan || kd_sub_kegiatan,
              kd_spm: r.kd_spm || kd_spm,
              volume: Number(r.volume || 0),
              satuan: r.satuan,
              harga: Number(r.harga || 0),
              total: Number(r.total || (Number(r.volume || 0) * Number(r.harga || 0))),
              sumdan: r.sumdan,
            })),
          },
        },
        include: {
          rincian: true,
        },
      });
      
      // Update status permintaan jika berubah
      if (existing.permintaan_belanja_id !== permintaan_belanja_id) {
        if (existing.permintaan_belanja_id) {
           await tx.permintaanBelanja.update({
             where: { id: existing.permintaan_belanja_id },
             data: { status: "draft" }
           });
        }
        if (permintaan_belanja_id) {
           await tx.permintaanBelanja.update({
             where: { id: Number(permintaan_belanja_id) },
             data: { status: "diproses_pengadaan" }
           });
        }
      }

      return p;
    });

    return NextResponse.json({ message: "Data berhasil diperbarui", data: pengadaan });
  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ error: "Nomor kontrak sudah ada" }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
