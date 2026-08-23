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

    const updated = await prisma.permintaanBelanja.update({
      where: { id: permintaanId },
      data: updateData,
    });

    return NextResponse.json({
      message: `Permintaan Belanja berhasil di-${action}`,
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
