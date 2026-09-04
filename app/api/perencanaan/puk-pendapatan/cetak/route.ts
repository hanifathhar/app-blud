import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const tahun = searchParams.get("tahun") || new Date().getFullYear().toString();
    const where: any = {
      tahun,
      nmSubKegiatan: {
        contains: "pendapatan",
        mode: "insensitive"
      }
    };

    let selectedUpt = "";
    if (auth.role !== "superadmin") {
      where.kdUpt = auth.kd_upt;
      selectedUpt = auth.kd_upt || "";
    } else {
      const kd_upt = searchParams.get("kd_upt");
      if (kd_upt) {
        where.kdUpt = kd_upt;
        selectedUpt = kd_upt;
      }
    }

    if (!selectedUpt) {
      return NextResponse.json({ error: "UPT belum dipilih. Silakan filter UPT terlebih dahulu untuk mencetak." }, { status: 400 });
    }

    // Get UPT detail for Kop Surat
    const upt = await prisma.msUpt.findFirst({
      where: { kd_upt: selectedUpt }
    });

    const dataRaw = await prisma.tblPuk.findMany({
      where,
      orderBy: [
        { kdUkm: 'asc' },
        { kdPeruntukan: 'asc' },
        { kdKomponen: 'asc' },
        { kdRincian: 'asc' },
        { kdSubKegiatan: 'asc' }
      ],
      include: {
        rincian: {
          orderBy: {
            id: 'asc'
          }
        }
      }
    });

    // Fetch related SubKegiatan to get kd_program and kd_kegiatan
    const kdSubkegiatans = Array.from(new Set(dataRaw.map(d => d.kdSubKegiatan).filter(Boolean) as string[]));
    const subkegiatans = await prisma.mSubGiat.findMany({
      where: { kd_sub_kegiatan: { in: kdSubkegiatans } }
    });

    const kdPrograms = Array.from(new Set(subkegiatans.map(s => s.kd_program?.trim()).filter(Boolean) as string[]));
    const kdKegiatans = Array.from(new Set(subkegiatans.map(s => s.kd_kegiatan?.trim()).filter(Boolean) as string[]));

    const programs = await prisma.mProg.findMany({
      where: { kd_program: { in: kdPrograms } }
    });
    const kegiatans = await prisma.mGiat.findMany({
      where: { kd_kegiatan: { in: kdKegiatans } }
    });

    const programMap = new Map(programs.map(p => [p.kd_program?.trim(), p.nm_program]));
    const kegiatanMap = new Map(kegiatans.map(k => [k.kd_kegiatan?.trim(), k.nm_kegiatan]));

    const subkegiatanProgramMap = new Map(subkegiatans.map(s => {
      const kd_prog = s.kd_program?.trim();
      const kd_keg = s.kd_kegiatan?.trim();
      return [s.kd_sub_kegiatan?.trim(), {
        kd_program: kd_prog,
        nm_program: kd_prog ? programMap.get(kd_prog) : null,
        kd_kegiatan: kd_keg,
        nm_kegiatan: kd_keg ? kegiatanMap.get(kd_keg) : null
      }];
    }));

    const data = dataRaw.map(d => {
      const related = d.kdSubKegiatan ? subkegiatanProgramMap.get(d.kdSubKegiatan.trim()) : null;
      return {
        ...d,
        kdProgram: related?.kd_program || null,
        nmProgram: related?.nm_program || "-",
        kdKegiatan: related?.kd_kegiatan || null,
        nmKegiatan: related?.nm_kegiatan || "-"
      };
    });

    return NextResponse.json({
      upt,
      data,
      tahun
    });

  } catch (error: any) {
    console.error("GET PUK CETAK Error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
