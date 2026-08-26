import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const permintaanId = parseInt(resolvedParams.id);
    if (isNaN(permintaanId)) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });

    const body = await req.json();
    const { action } = body; // action: "verifikasi", "setuju", "tolak"

    const permintaan = await prisma.permintaanBelanja.findUnique({
      where: { id: permintaanId },
    });

    if (!permintaan) {
      return NextResponse.json({ error: "Permintaan Belanja tidak ditemukan" }, { status: 404 });
    }

    let updateData: any = { tgl_update: new Date() };

    // Validasi wewenang (level admin)
    // Asumsi:
    // level 4 (Keuangan/Verifikator) -> melakukan "verifikasi" (mengubah ke diverifikasi)
    // level 2 (KPA/Pimpinan) -> melakukan "setuju" atau "tolak"
    if (action === "verifikasi") {
      if (permintaan.status !== "draft" && permintaan.status !== "diajukan") {
        return NextResponse.json({ error: "Hanya status draft/diajukan yang dapat diverifikasi" }, { status: 400 });
      }
      updateData.status = "diverifikasi";
      updateData.diverifikasi_oleh = auth.username;
    } else if (action === "setuju") {
      if (permintaan.status !== "diverifikasi") {
        return NextResponse.json({ error: "Harus diverifikasi sebelum disetujui" }, { status: 400 });
      }
      updateData.status = "disetujui";
      updateData.disetujui_oleh = auth.username;
    } else if (action === "tolak") {
      updateData.status = "ditolak";
    } else {
      return NextResponse.json({ error: "Aksi tidak dikenali" }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedPermintaan = await tx.permintaanBelanja.update({
        where: { id: permintaanId },
        data: updateData,
      });

      // Auto-create Tagihan for non_pengadaan
      if (action === "setuju" && updatedPermintaan.jenis_permintaan === "non_pengadaan") {
        const rincian = await tx.rincianPermintaanBelanja.aggregate({
          where: { permintaan_belanja_id: permintaanId },
          _sum: { total: true }
        });
        
        const nilaiTagihan = rincian._sum.total || 0;
        
        // Cek jika tagihan sudah ada (untuk menghindari duplikasi saat retry)
        const existingTagihan = await tx.tagihan.findFirst({
          where: { permintaan_belanja_id: permintaanId }
        });

        if (!existingTagihan) {
          await tx.tagihan.create({
            data: {
              permintaan_belanja_id: updatedPermintaan.id,
              no_tagihan: `TGH-${updatedPermintaan.no_permintaan}`,
              tgl_tagihan: new Date(),
              nilai_tagihan: nilaiTagihan,
              keterangan: updatedPermintaan.keterangan || `Tagihan otomatis dari permintaan non pengadaan ${updatedPermintaan.no_permintaan}`,
              status: "belum_dibayar",
            }
          });
        }
      }

      return updatedPermintaan;
    });

    return NextResponse.json({
      message: `Permintaan Belanja berhasil di-${action}`,
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
