import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

// UPDATE UPT
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth || auth.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
    }

    const body = await req.json();
    const { kd_upt, nm_upt, type, alamat, kecamatan, kabupaten, email, no_tlp, status } = body;

    const updated = await prisma.msUpt.update({
      where: { id },
      data: {
        kd_upt: kd_upt || null,
        nm_upt,
        type,
        alamat: alamat || null,
        kecamatan: kecamatan || null,
        kabupaten: kabupaten || null,
        email: email || null,
        no_tlp: no_tlp || null,
        status: status !== undefined ? parseInt(status) : 1
      }
    });

    return NextResponse.json({ message: "Data UPT berhasil diupdate", data: updated });
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengupdate data UPT" }, { status: 500 });
  }
}

// DELETE UPT
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth || auth.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
    }

    await prisma.msUpt.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Data UPT berhasil dihapus" });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menghapus data UPT (mungkin data ini masih digunakan)" }, { status: 500 });
  }
}
