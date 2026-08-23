import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    if (auth.role !== "superadmin" && auth.role !== "bendahara") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const body = await req.json();
    const {
      no_permintaan,
      tgl_permintaan,
      kd_ukm, nm_ukm,
      kd_peruntukan, nm_peruntukan,
      kd_komponen, nm_komponen,
      kd_rincian, nm_rincian,
      kd_sub_kegiatan, nm_sub_kegiatan,
      kd_spm, nm_spm,
      keterangan,
      tahun,
      kd_upt: bodyKdUpt,
      rincian, // Array of objects
    } = body;

    const kd_upt = bodyKdUpt || auth.unit;

    if (!rincian || rincian.length === 0 || !kd_upt) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    // Pastikan data lama masih ada dan statusnya draft
    const existing = await prisma.permintaanBelanja.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    }

    if (existing.status !== "draft") {
      return NextResponse.json({ error: "Hanya permintaan dengan status draft yang dapat diubah" }, { status: 400 });
    }

    // Validasi ketersediaan anggaran (Pagu - Permintaan yang sudah ada - dikurangi rincian lama dari permintaan ini agar tidak double count)
    for (const r of rincian) {
      const kd_rek6 = r.kd_rek6;
      const requestedValue = Number(r.volume || 0) * Number(r.harga || 0);

      // 1. Get Pagu from TblRbaRincianPenetapan
      const paguData = await prisma.tblRbaRincianPenetapan.aggregate({
        where: {
          tahun,
          kdUnit: kd_upt,
          kd_rek6,
          rba_penetapan: {
            is: {
              is_aktif: true
            }
          }
        },
        _sum: {
          total: true
        }
      });
      const pagu = Number(paguData._sum.total || 0);

      // 2. Get existing requests EXCLUDING the current request
      const existingRequests = await prisma.rincianPermintaanBelanja.aggregate({
        where: {
          kd_rek6,
          permintaan_belanja: {
            is: {
              tahun,
              kd_upt,
              id: { not: id }, // Exclude current request being edited
              status: {
                notIn: ["ditolak", "batal"]
              }
            }
          }
        },
        _sum: {
          total: true
        }
      });
      const usedBudget = Number(existingRequests._sum.total || 0);

      if (pagu < (usedBudget + requestedValue)) {
        return NextResponse.json({ 
          error: `Anggaran untuk Rekening ${kd_rek6} tidak mencukupi. (Sisa: Rp ${(pagu - usedBudget).toLocaleString('id-ID')} | Diminta: Rp ${requestedValue.toLocaleString('id-ID')})` 
        }, { status: 400 });
      }
    }

    // 3. Update the request in a transaction
    const updated = await prisma.$transaction(async (tx) => {
      // a. Update header
      const header = await tx.permintaanBelanja.update({
        where: { id },
        data: {
          tgl_permintaan: new Date(tgl_permintaan),
          kd_upt,
          kd_ukm, nm_ukm,
          kd_peruntukan, nm_peruntukan,
          kd_komponen, nm_komponen,
          kd_rincian, nm_rincian,
          kd_sub_kegiatan, nm_sub_kegiatan,
          kd_spm, nm_spm,
          keterangan,
          tahun,
          dibuat_oleh: auth.user
        }
      });

      // b. Delete old rincian
      await tx.rincianPermintaanBelanja.deleteMany({
        where: { permintaan_belanja_id: id }
      });

      // c. Insert new rincian
      for (const r of rincian) {
        await tx.rincianPermintaanBelanja.create({
          data: {
            permintaan_belanja_id: id,
            kd_rek6: r.kd_rek6,
            nm_rek6: r.nm_rek6,
            uraian: r.uraian,
            volume: Number(r.volume || 0),
            satuan: r.satuan,
            harga: Number(r.harga || 0),
            total: Number(r.volume || 0) * Number(r.harga || 0),
            sumdan: r.sumdan,
            kd_ukm,
            kd_peruntukan,
            kd_komponen,
            kd_rincian,
            kd_sub_kegiatan,
            kd_spm,
            no_permintaan,
            tgl_permintaan: new Date(tgl_permintaan)
          }
        });
      }

      return header;
    });

    return NextResponse.json({ message: "Permintaan belanja berhasil diubah", data: updated });

  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (auth.role !== "superadmin" && auth.role !== "bendahara") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const resolvedParams = await params;
    const id = Number(resolvedParams.id);
    if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const existing = await prisma.permintaanBelanja.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: "Data tidak ditemukan" }, { status: 404 });
    }

    if (existing.status !== "draft") {
      return NextResponse.json({ error: "Hanya permintaan dengan status draft yang dapat dihapus" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.rincianPermintaanBelanja.deleteMany({
        where: { permintaan_belanja_id: id }
      });
      await tx.permintaanBelanja.delete({
        where: { id }
      });
    });

    return NextResponse.json({ message: "Data berhasil dihapus" });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

