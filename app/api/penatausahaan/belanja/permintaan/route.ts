import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const tahun = url.searchParams.get("tahun");
    const kd_upt = url.searchParams.get("kd_upt") || auth.unit;

    const param_kd_upt = url.searchParams.get("kd_upt");
    const status = url.searchParams.get("status");

    let whereClause: any = {};
    if (tahun) whereClause.tahun = tahun;
    if (status) whereClause.status = status;
    
    if (auth.level === 1) {
      if (param_kd_upt) whereClause.kd_upt = param_kd_upt;
    } else {
      if (kd_upt) whereClause.kd_upt = kd_upt;
    }

    const unused = url.searchParams.get("unused");
    if (unused === "true") {
      whereClause.pengadaan = null;
    }

    const permintaanList = await prisma.permintaanBelanja.findMany({
      where: whereClause,
      include: {
        rincian: true,
      },
      orderBy: {
        tgl_dibuat: "desc",
      },
    });

    return NextResponse.json({ data: permintaanList });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

    if (!no_permintaan || !tgl_permintaan || !rincian || rincian.length === 0 || !kd_upt) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    // Validasi ketersediaan anggaran (Pagu - Permintaan yang sudah ada)
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

      // 2. Get existing requests (Draft, Diajukan, Diverifikasi, Disetujui, Proses Bayar)
      // Note: We might need to also include actual BKU/SP2D later for exact realisasi
      const existingRequests = await prisma.rincianPermintaanBelanja.aggregate({
        where: {
          kd_rek6,
          permintaan_belanja: {
            is: {
              tahun,
              kd_upt,
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
          error: `Anggaran tidak mencukupi untuk rekening ${kd_rek6}. Sisa Pagu: ${pagu - usedBudget}, Diminta: ${requestedValue}` 
        }, { status: 400 });
      }
    }

    // Insert permintaan dan rincian
    const permintaan = await prisma.$transaction(async (tx) => {
      const p = await tx.permintaanBelanja.create({
        data: {
          no_permintaan,
          tgl_permintaan: new Date(tgl_permintaan),
          kd_upt: kd_upt || "",
          kd_ukm, nm_ukm,
          kd_peruntukan, nm_peruntukan,
          kd_komponen, nm_komponen,
          kd_rincian, nm_rincian,
          kd_sub_kegiatan, nm_sub_kegiatan,
          kd_spm, nm_spm,
          keterangan,
          tahun,
          status: "draft",
          dibuat_oleh: auth.username,
          rincian: {
            create: rincian.map((r: any) => ({
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
            })),
          },
        },
        include: {
          rincian: true,
        },
      });

      return p;
    });

    return NextResponse.json({ 
      message: "Permintaan Belanja berhasil dibuat", 
      data: permintaan 
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Nomor permintaan sudah ada" }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
