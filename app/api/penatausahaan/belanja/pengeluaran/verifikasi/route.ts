import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    // Verifikasi pengeluaran diizinkan untuk superadmin, KPA, dan keuangan (level 1, 2, 4)
    const allowedRoles = ["superadmin", "kpa", "keuangan"];
    const allowedLevels = [1, 2, 4];
    const isAllowed = allowedRoles.includes(user.role) || (user.level && allowedLevels.includes(user.level));

    if (!isAllowed) {
      return NextResponse.json(
        { success: false, message: "Forbidden: Hanya Superadmin, KPA, dan Keuangan yang dapat memverifikasi pengeluaran" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { id, action } = body;

    const pengeluaranId = Number(id);
    if (isNaN(pengeluaranId)) {
      return NextResponse.json({ success: false, message: "ID pengeluaran tidak valid" }, { status: 400 });
    }

    const existing = await prisma.pengeluaran.findUnique({ where: { id: pengeluaranId } });
    if (!existing) {
      return NextResponse.json({ success: false, message: "Data pengeluaran tidak ditemukan" }, { status: 404 });
    }

    // Cek wewenang UPT bila bukan superadmin
    if (user.role !== "superadmin" && user.level !== 1) {
      if (user.kd_upt && existing.kd_upt && user.kd_upt !== existing.kd_upt) {
        return NextResponse.json({ success: false, message: "Forbidden: Tidak memiliki akses ke unit ini" }, { status: 403 });
      }
    }

    if (existing.pengesahan === 1) {
      return NextResponse.json({
        success: false,
        message: "Pengeluaran ini sudah disahkan dalam LPJ dan tidak dapat diubah status verifikasinya secara langsung. Batalkan pengesahan LPJ terlebih dahulu jika ingin mengubahnya."
      }, { status: 400 });
    }

    let verifStatus = 0;
    if (action === "verifikasi") {
      verifStatus = 1;
    } else if (action === "batal_verifikasi") {
      verifStatus = 0;
    } else {
      return NextResponse.json({ success: false, message: "Aksi verifikasi tidak valid" }, { status: 400 });
    }

    const updated = await prisma.pengeluaran.update({
      where: { id: pengeluaranId },
      data: {
        verif: verifStatus,
        tgl_verif: verifStatus === 1 ? new Date() : null,
        user_verif: verifStatus === 1 ? (user.username || user.nama || "User") : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: verifStatus === 1 ? "Pengeluaran berhasil diverifikasi" : "Verifikasi pengeluaran berhasil dibatalkan",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message || "Terjadi kesalahan internal server" }, { status: 500 });
  }
}
