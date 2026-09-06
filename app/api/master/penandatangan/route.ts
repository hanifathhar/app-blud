import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export const KODE_JABATAN_MAP: Record<number, string> = {
  1: "Kuasa Pengguna Anggaran (KPA)",
  2: "Pejabat Pelaksana Teknis Kegiatan (PPTK)",
  3: "Subag Keuangan",
  4: "Bendahara Penerimaan",
  5: "Bendahara Pengeluaran",
};

// GET all / filtered Penandatangan
export async function GET(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const q = searchParams.get("q") || "";
    const kd_upt_param = searchParams.get("kd_upt");
    const kode_param = searchParams.get("kode");
    const status_param = searchParams.get("status");
    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const all = searchParams.get("all") === "true";

    const isSuperAdmin = auth.role === "superadmin" || auth.level === 1;
    const userKdUpt = auth.kd_upt || auth.unit;

    const where: any = {};

    // Filter UPT
    if (!isSuperAdmin && userKdUpt) {
      where.kd_upt = userKdUpt;
    } else if (kd_upt_param) {
      where.kd_upt = kd_upt_param;
    }

    // Filter Kode Jabatan (1=KPA, 2=PPTK, 3=Subag Keuangan, 4=Bendahara Penerimaan, 5=Bendahara Pengeluaran)
    if (kode_param) {
      where.kode = parseInt(kode_param);
    }

    // Filter Status (1=Aktif, 0=Nonaktif)
    if (status_param !== null && status_param !== undefined && status_param !== "") {
      where.status = parseInt(status_param);
    }

    // Search query
    if (q) {
      where.OR = [
        { nama: { contains: q, mode: "insensitive" } },
        { nip: { contains: q, mode: "insensitive" } },
        { jabatan: { contains: q, mode: "insensitive" } },
        { nm_upt: { contains: q, mode: "insensitive" } },
        { pangkat_golongan: { contains: q, mode: "insensitive" } },
      ];
    }

    // Jika tanpa paginasi atau all=true
    if ((!pageParam && !limitParam) || all || limitParam === "all") {
      const data = await prisma.penandatangan.findMany({
        where,
        orderBy: [{ kd_upt: "asc" }, { kode: "asc" }, { nama: "asc" }],
      });
      return NextResponse.json({
        data,
        pagination: {
          total: data.length,
          page: 1,
          limit: data.length,
          totalPages: 1,
        },
      });
    }

    const page = parseInt(pageParam || "1");
    const limit = parseInt(limitParam || "10");
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.penandatangan.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ kd_upt: "asc" }, { kode: "asc" }, { nama: "asc" }],
      }),
      prisma.penandatangan.count({ where }),
    ]);

    return NextResponse.json({
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server" }, { status: 500 });
  }
}

// CREATE new Penandatangan
export async function POST(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const allowedRoles = ["superadmin", "kpa", "keuangan", "bendahara"];
    const allowedLevels = [1, 2, 4, 5];
    const isAllowed = allowedRoles.includes(auth.role) || (auth.level && allowedLevels.includes(auth.level));
    if (!isAllowed) {
      return NextResponse.json({ error: "Forbidden: Anda tidak memiliki akses untuk menambah data penandatangan" }, { status: 403 });
    }

    const body = await req.json();
    let { kd_upt, nm_upt, kode, jabatan, nama, nip, pangkat_golongan, status } = body;

    const isSuperAdmin = auth.role === "superadmin" || auth.level === 1;
    const userKdUpt = auth.kd_upt || auth.unit;

    if (!isSuperAdmin && userKdUpt) {
      kd_upt = userKdUpt;
    }

    if (!kd_upt) {
      return NextResponse.json({ error: "UPT wajib dipilih" }, { status: 400 });
    }
    if (!nama || !nama.trim()) {
      return NextResponse.json({ error: "Nama pejabat penandatangan wajib diisi" }, { status: 400 });
    }

    const kodeNum = parseInt(kode || "1");
    if (isNaN(kodeNum) || kodeNum < 1 || kodeNum > 5) {
      return NextResponse.json({ error: "Kode penandatangan harus antara 1 sampai 5" }, { status: 400 });
    }

    // Default nama jabatan jika tidak diisi
    if (!jabatan || !jabatan.trim()) {
      jabatan = KODE_JABATAN_MAP[kodeNum] || "Penandatangan";
    }

    // Cari nama UPT jika belum ada
    if (!nm_upt) {
      const upt = await prisma.msUpt.findFirst({ where: { kd_upt } });
      if (upt) nm_upt = upt.nm_upt;
    }

    const created = await prisma.penandatangan.create({
      data: {
        kd_upt,
        nm_upt: nm_upt || null,
        kode: kodeNum,
        jabatan: jabatan.trim(),
        nama: nama.trim(),
        nip: nip ? nip.trim() : null,
        pangkat_golongan: pangkat_golongan ? pangkat_golongan.trim() : null,
        status: status !== undefined ? parseInt(status) : 1,
      },
    });

    return NextResponse.json({ message: "Data penandatangan berhasil ditambahkan", data: created });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server" }, { status: 500 });
  }
}

// UPDATE Penandatangan
export async function PUT(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const allowedRoles = ["superadmin", "kpa", "keuangan", "bendahara"];
    const allowedLevels = [1, 2, 4, 5];
    const isAllowed = allowedRoles.includes(auth.role) || (auth.level && allowedLevels.includes(auth.level));
    if (!isAllowed) {
      return NextResponse.json({ error: "Forbidden: Anda tidak memiliki akses untuk mengubah data penandatangan" }, { status: 403 });
    }

    const body = await req.json();
    const { id, kd_upt, nm_upt, kode, jabatan, nama, nip, pangkat_golongan, status } = body;

    const penandatanganId = parseInt(id);
    if (isNaN(penandatanganId)) {
      return NextResponse.json({ error: "ID penandatangan tidak valid" }, { status: 400 });
    }

    const existing = await prisma.penandatangan.findUnique({ where: { id: penandatanganId } });
    if (!existing) {
      return NextResponse.json({ error: "Data penandatangan tidak ditemukan" }, { status: 404 });
    }

    const isSuperAdmin = auth.role === "superadmin" || auth.level === 1;
    const userKdUpt = auth.kd_upt || auth.unit;

    if (!isSuperAdmin && userKdUpt && existing.kd_upt !== userKdUpt) {
      return NextResponse.json({ error: "Forbidden: Anda tidak memiliki akses ke UPT ini" }, { status: 403 });
    }

    const kodeNum = kode !== undefined ? parseInt(kode) : existing.kode;
    const finalJabatan = jabatan ? jabatan.trim() : KODE_JABATAN_MAP[kodeNum] || existing.jabatan;

    let finalNmUpt = nm_upt;
    if (kd_upt && (!finalNmUpt || kd_upt !== existing.kd_upt)) {
      const upt = await prisma.msUpt.findFirst({ where: { kd_upt } });
      if (upt) finalNmUpt = upt.nm_upt;
    }

    const updated = await prisma.penandatangan.update({
      where: { id: penandatanganId },
      data: {
        kd_upt: isSuperAdmin ? (kd_upt || existing.kd_upt) : existing.kd_upt,
        nm_upt: isSuperAdmin ? (finalNmUpt ?? existing.nm_upt) : existing.nm_upt,
        kode: kodeNum,
        jabatan: finalJabatan,
        nama: nama !== undefined ? nama.trim() : existing.nama,
        nip: nip !== undefined ? (nip ? nip.trim() : null) : existing.nip,
        pangkat_golongan: pangkat_golongan !== undefined ? (pangkat_golongan ? pangkat_golongan.trim() : null) : existing.pangkat_golongan,
        status: status !== undefined ? parseInt(status) : existing.status,
      },
    });

    return NextResponse.json({ message: "Data penandatangan berhasil diperbarui", data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server" }, { status: 500 });
  }
}

// DELETE Penandatangan
export async function DELETE(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const allowedRoles = ["superadmin", "kpa", "keuangan", "bendahara"];
    const allowedLevels = [1, 2, 4, 5];
    const isAllowed = allowedRoles.includes(auth.role) || (auth.level && allowedLevels.includes(auth.level));
    if (!isAllowed) {
      return NextResponse.json({ error: "Forbidden: Anda tidak memiliki akses untuk menghapus data penandatangan" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const idParam = searchParams.get("id");
    const id = parseInt(idParam || "");

    if (isNaN(id)) {
      return NextResponse.json({ error: "ID penandatangan tidak valid" }, { status: 400 });
    }

    const existing = await prisma.penandatangan.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Data penandatangan tidak ditemukan" }, { status: 404 });
    }

    const isSuperAdmin = auth.role === "superadmin" || auth.level === 1;
    const userKdUpt = auth.kd_upt || auth.unit;

    if (!isSuperAdmin && userKdUpt && existing.kd_upt !== userKdUpt) {
      return NextResponse.json({ error: "Forbidden: Anda tidak memiliki akses ke UPT ini" }, { status: 403 });
    }

    await prisma.penandatangan.delete({ where: { id } });

    return NextResponse.json({ message: "Data penandatangan berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server saat menghapus data" }, { status: 500 });
  }
}
