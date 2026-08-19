import { NextResponse, NextRequest } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const prisma = new PrismaClient();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const kd_upt = searchParams.get("kd_upt") || "";
    const q = searchParams.get("q") || "";

    let where: any = {};
    if (kd_upt) {
      where.kdUnit = kd_upt;
    }
    if (q) {
      where.OR = [
        { nomor_penetapan: { contains: q, mode: "insensitive" } },
        { keterangan: { contains: q, mode: "insensitive" } }
      ];
    }

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    // Ambil semua data penetapan yang distinct per UPT dan nomor penetapan
    const penetapanDistinct = await prisma.tblRbaPenetapan.findMany({
      where,
      distinct: ['kdUnit', 'nomor_penetapan'],
      orderBy: { tgl_update: "desc" },
      select: {
        id: true,
        nomor_penetapan: true,
        tanggal_penetapan: true,
        keterangan: true,
        kdUnit: true,
        nmUnit: true,
        is_aktif: true,
      }
    });

    const total = penetapanDistinct.length;
    const totalPages = Math.ceil(total / limit);
    
    // Pagination slicing
    const paginatedData = penetapanDistinct.slice((page - 1) * limit, page * limit);

    // Hitung jumlah RBA per penetapan dan pisahkan Belanja vs Pendapatan
    const result = await Promise.all(
      paginatedData.map(async (p: any) => {
        const allRba = await prisma.tblRbaPenetapan.findMany({
          where: { kdUnit: p.kdUnit, nomor_penetapan: p.nomor_penetapan },
          select: { nmSubKegiatan: true, nilai: true }
        });
        
        let totalBelanja = 0;
        let totalPendapatan = 0;

        allRba.forEach(r => {
          const val = Number(r.nilai) || 0;
          const subKeg = r.nmSubKegiatan?.toUpperCase() || "";
          if (subKeg === 'PENDAPATAN' || subKeg === 'PEMBIAYAAN') {
             totalPendapatan += val;
          } else {
             totalBelanja += val;
          }
        });

        return {
          ...p,
          jumlah_rba: allRba.length,
          total_belanja: totalBelanja,
          total_pendapatan: totalPendapatan
        };
      })
    );

    return NextResponse.json({ 
      success: true, 
      data: result,
      pagination: { total, page, limit, totalPages }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { kdUnit, nomor_penetapan, tanggal_penetapan, keterangan } = body;

    if (!kdUnit || !nomor_penetapan) {
      return NextResponse.json({ success: false, message: "UPT dan Nomor Penetapan wajib diisi" }, { status: 400 });
    }

    const rbas = await prisma.tblRba.findMany({
      where: { kdUnit },
      include: { rincian: true },
    });

    if (rbas.length === 0) {
      return NextResponse.json({ success: false, message: "Tidak ada data RBA di UPT ini untuk diposting" }, { status: 404 });
    }

    // Cek apakah penetapan dengan nomor ini sudah ada dan berstatus aktif
    const existingAktif = await prisma.tblRbaPenetapan.findFirst({
      where: { kdUnit, nomor_penetapan, is_aktif: true }
    });
    if (existingAktif) {
      return NextResponse.json({ success: false, message: "Penetapan ini sedang Aktif dan tidak dapat ditimpa/diubah. Nonaktifkan terlebih dahulu jika ingin mengganti." }, { status: 400 });
    }

    // Replace jika penetapan dengan nomor ini sudah ada di UPT tersebut
    await prisma.tblRbaPenetapan.deleteMany({
      where: { kdUnit, nomor_penetapan },
    });

    const tx = rbas.map((rba: any) => {
      const { id, rincian, ...rbaData } = rba;
      return prisma.tblRbaPenetapan.create({
        data: {
          ...rbaData,
          nomor_penetapan,
          tanggal_penetapan: tanggal_penetapan ? new Date(tanggal_penetapan) : null,
          keterangan,
          rincian: {
            create: rincian.map((r: any) => {
              const { id: rId, no_rba: rNoRba, ...rincianData } = r;
              return {
                ...rincianData,
                tanggal_penetapan: tanggal_penetapan ? new Date(tanggal_penetapan) : null,
                keterangan,
              };
            }),
          },
        },
      });
    });

    // Otomatis tetapkan SILPA di tahun dan UPT yang sama
    const tahunRba = rbas[0]?.tahun || "";
    
    // Fetch draft/active SILPA
    const silpas = await prisma.tblSilpa.findMany({
      where: { kd_upt: kdUnit, tahun: tahunRba }
    });

    const silpaPenetapanTx = silpas.filter((s: any) => Number(s.nilai) > 0).map((s: any) => {
      return prisma.tblRbaPenetapan.create({
        data: {
          no_rba: `RBA-${kdUnit}-SILPA-${s.kd_rek6}`,
          nomor_penetapan,
          tanggal_penetapan: tanggal_penetapan ? new Date(tanggal_penetapan) : null,
          keterangan,
          kdUnit: s.kd_upt,
          nmUnit: s.nm_upt,
          tahun: s.tahun,
          kdSubKegiatan: '0.00.00.0.01.01',
          nmSubKegiatan: 'PEMBIAYAAN',
          noPuk: `${s.kd_upt}0.00.00.0.01.01`,
          kd_rek6: s.kd_rek6,
          nm_rek6: s.nm_rek6,
          nilai: s.nilai,
          rincian: {
            create: [
              {
                tanggal_penetapan: tanggal_penetapan ? new Date(tanggal_penetapan) : null,
                keterangan,
                kdUnit: s.kd_upt,
                nmUnit: s.nm_upt,
                tahun: s.tahun,
                kdSubKegiatan: '0.00.00.0.01.01',
                nmSubKegiatan: 'PEMBIAYAAN',
                noPuk: `${s.kd_upt}0.00.00.0.01.01`,
                kd_rek6: s.kd_rek6,
                nm_rek6: s.nm_rek6,
                uraian: s.nm_rek6,
                volume: 1,
                satuan: 'Tahun',
                nilai: s.nilai,
                total: s.nilai,
              }
            ]
          }
        }
      });
    });

    await prisma.$transaction([...tx, ...silpaPenetapanTx]);

    // Update status TblSilpa
    if (tahunRba) {
      await prisma.tblSilpa.updateMany({
        where: { kd_upt: kdUnit, tahun: tahunRba, status: "draft" },
        data: {
          status: "ditetapkan",
          nomor_penetapan,
          tanggal_penetapan: tanggal_penetapan ? new Date(tanggal_penetapan) : null
        }
      });
    }

    return NextResponse.json({ success: true, message: `Berhasil memposting ${rbas.length} RBA` });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const kdUnit = searchParams.get("kdUnit");
    const nomor_penetapan = searchParams.get("nomor_penetapan");

    if (!kdUnit || !nomor_penetapan) {
      return NextResponse.json({ success: false, message: "kdUnit dan nomor_penetapan harus diisi" }, { status: 400 });
    }

    // Hanya superadmin atau user UPT bersangkutan yang bisa menghapus
    if (auth.role !== "superadmin" && auth.kd_upt !== kdUnit) {
      return NextResponse.json({ success: false, message: "Akses ditolak" }, { status: 403 });
    }

    // Cek apakah data ini sedang aktif
    const existingAktif = await prisma.tblRbaPenetapan.findFirst({
      where: { kdUnit, nomor_penetapan, is_aktif: true }
    });
    if (existingAktif) {
      return NextResponse.json({ success: false, message: "Penetapan yang sedang Aktif tidak dapat dihapus." }, { status: 400 });
    }

    // Menghapus data penetapan dan rinciannya secara cascade
    await prisma.tblRbaPenetapan.deleteMany({
      where: { kdUnit, nomor_penetapan }
    });

    // Otomatis kembalikan status SILPA ke draft
    await prisma.tblSilpa.updateMany({
      where: { kd_upt: kdUnit, nomor_penetapan },
      data: {
        status: "draft",
        nomor_penetapan: null,
        tanggal_penetapan: null
      }
    });

    return NextResponse.json({ success: true, message: "Penetapan berhasil dibatalkan" });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { kdUnit, nomor_penetapan, action } = body;

    if (!kdUnit || !nomor_penetapan) {
      return NextResponse.json({ success: false, message: "kdUnit dan nomor_penetapan harus diisi" }, { status: 400 });
    }

    if (auth.role !== "superadmin" && auth.kd_upt !== kdUnit) {
      return NextResponse.json({ success: false, message: "Akses ditolak" }, { status: 403 });
    }

    if (action === "deactivate") {
      await prisma.tblRbaPenetapan.updateMany({
        where: { kdUnit, nomor_penetapan },
        data: { is_aktif: false }
      });
      return NextResponse.json({ success: true, message: "Status penetapan berhasil dinonaktifkan" });
    }

    const current_tahun = auth.tahun || new Date().getFullYear().toString();

    // Jalankan dalam transaksi agar aman
    await prisma.$transaction(async (tx) => {
      // 1. Nonaktifkan semua penetapan untuk UPT ini di tahun berjalan
      await tx.tblRbaPenetapan.updateMany({
        where: { kdUnit, tahun: current_tahun },
        data: { is_aktif: false }
      });

      // 2. Aktifkan penetapan yang dipilih
      await tx.tblRbaPenetapan.updateMany({
        where: { kdUnit, nomor_penetapan, tahun: current_tahun },
        data: { is_aktif: true }
      });
    });

    return NextResponse.json({ success: true, message: "Status penetapan berhasil diaktifkan" });
  } catch (error: any) {
    console.error("Error PUT aktifkan:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
