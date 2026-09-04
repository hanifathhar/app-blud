import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const kdUnit = searchParams.get("kdUnit");
    const nomor_penetapan = searchParams.get("nomor_penetapan");
    const jenis = searchParams.get("jenis") || "ringkasan"; // 'ringkasan' or 'rka'
    const kdSubKegiatan = searchParams.get("kdSubKegiatan");

    if (!kdUnit || !nomor_penetapan) {
      return NextResponse.json({ success: false, message: "Parameter tidak lengkap" }, { status: 400 });
    }

    // Security check
    if (auth.role !== "superadmin" && auth.kd_upt !== kdUnit) {
      return NextResponse.json({ success: false, message: "Akses ditolak" }, { status: 403 });
    }

    const penetapanList = await prisma.tblRbaPenetapan.findMany({
      where: { kdUnit, nomor_penetapan },
      orderBy: { tgl_update: "desc" },
      include: { rincian: { orderBy: { kd_rek6: 'asc' } } }
    });

    if (!penetapanList || penetapanList.length === 0) {
      return NextResponse.json({ success: false, message: "Dokumen tidak ditemukan" }, { status: 404 });
    }

    // Filter penetapan berdasarkan jenis
    let filteredPenetapanList = penetapanList;
    if (jenis === "rka" && kdSubKegiatan) {
      filteredPenetapanList = penetapanList.filter(p => p.kdSubKegiatan === kdSubKegiatan);
    }

    if (filteredPenetapanList.length === 0) {
      return NextResponse.json({ success: false, message: "Sub Kegiatan tidak ditemukan pada dokumen ini" }, { status: 404 });
    }

    let allRincian: any[] = [];
    filteredPenetapanList.forEach(p => {
      if (p.rincian) {
        const rincianWithMeta = p.rincian.map(r => ({
          ...r,
          kdSpm: p.kdSpm || "-",
          nmSpm: p.nmSpm || "-",
          sumdan: p.sumdan || "-",
          kdSubKegiatan: p.kdSubKegiatan || "-"
        }));
        allRincian = allRincian.concat(rincianWithMeta);
      }
    });



    // Ambil metadata dari record pertama (jika RKA per sub-kegiatan, ini record yg tepat)
    let penetapan = { ...filteredPenetapanList[0] };
    
    // Gabungkan sumdan dan spm jika ada lebih dari satu record (misal BLUD dan JKN)
    const sumdanSet = new Set<string>();
    const spmSet = new Set<string>();
    filteredPenetapanList.forEach(p => {
      if (p.sumdan) sumdanSet.add(p.sumdan);
      if (p.nmSpm) spmSet.add(p.nmSpm);
    });
    penetapan.sumdan = Array.from(sumdanSet).join(", ");
    penetapan.nmSpm = Array.from(spmSet).join(", ");

    // Metadata Program & Kegiatan
    let metadata = {
      kd_program: "",
      nm_program: "",
      kd_kegiatan: "",
      nm_kegiatan: ""
    };

    if (penetapan.kdSubKegiatan) {
      const subGiat = await prisma.mSubGiat.findFirst({
        where: { kd_sub_kegiatan: penetapan.kdSubKegiatan }
      });
      if (subGiat) {
        if (subGiat.kd_program) {
          const prog = await prisma.mProg.findFirst({ where: { kd_program: subGiat.kd_program.trim() } });
          if (prog) {
            metadata.kd_program = prog.kd_program || "";
            metadata.nm_program = prog.nm_program || "";
          }
        }
        if (subGiat.kd_kegiatan) {
          const giat = await prisma.mGiat.findFirst({ where: { kd_kegiatan: subGiat.kd_kegiatan.trim() } });
          if (giat) {
            metadata.kd_kegiatan = giat.kd_kegiatan || "";
            metadata.nm_kegiatan = giat.nm_kegiatan || "";
          }
        }
      }
    }

    // Unique Rekening Codes
    const rek2Set = new Set<string>();
    const rek3Set = new Set<string>();

    filteredPenetapanList.forEach(p => {
      p.rincian.forEach(r => {
        if (r.kd_rek6) {
          if (r.kd_rek6.length >= 3) rek2Set.add(r.kd_rek6.substring(0, 3)); // e.g. 5.1
          if (r.kd_rek6.length >= 6) rek3Set.add(r.kd_rek6.substring(0, 6)); // e.g. 5.1.01
        }
      });
    });

    let rek2Data;
    let rek3Data;

    if (jenis === 'ringkasan') {
      rek2Data = await prisma.msRek2.findMany({
        where: {
          OR: [
            { kd_rek2: { startsWith: '4' } },
            { kd_rek2: { startsWith: '5' } },
            { kd_rek2: { startsWith: '6' } }
          ]
        },
        orderBy: { kd_rek2: 'asc' }
      });

      rek3Data = await prisma.msRek3.findMany({
        where: {
          OR: [
            { kd_rek3: { startsWith: '4' } },
            { kd_rek3: { startsWith: '5' } },
            { kd_rek3: { startsWith: '6' } }
          ]
        },
        orderBy: { kd_rek3: 'asc' }
      });
    } else {
      rek2Data = await prisma.msRek2.findMany({
        where: {
          OR: Array.from(rek2Set).length > 0 ? Array.from(rek2Set).map(kd => ({
            kd_rek2: { startsWith: kd } // Use startsWith because of Char(4) trailing spaces
          })) : [{ kd_rek2: 'INVALID_EMPTY' }]
        }
      });

      rek3Data = await prisma.msRek3.findMany({
        where: {
          OR: Array.from(rek3Set).length > 0 ? Array.from(rek3Set).map(kd => ({
            kd_rek3: kd
          })) : [{ kd_rek3: 'INVALID_EMPTY' }]
        }
      });
    }

    const rek2Dict: Record<string, string> = {};
    rek2Data.forEach(r => {
      if (r.kd_rek2 && r.nm_rek2) rek2Dict[r.kd_rek2.trim()] = r.nm_rek2;
    });

    const rek3Dict: Record<string, string> = {};
    rek3Data.forEach(r => {
      if (r.kd_rek3 && r.nm_rek3) rek3Dict[r.kd_rek3.trim()] = r.nm_rek3;
    });

    let spmMaster: any[] = [];
    if (jenis === "rka_spm") {
      spmMaster = await prisma.msSpm.findMany({
        orderBy: { kd_spm: "asc" }
      });
    }

    // Serialize BigInt for JSON
    const serializedPenetapan = {
      ...penetapan,
      id: penetapan.id.toString(),
      nilai: Number(penetapan.nilai),
      rincian: allRincian.map(r => ({
        ...r,
        id: r.id.toString(),
        volume: Number(r.volume || 0),
        nilai: Number(r.nilai || 0),
        total: Number(r.total || 0)
      }))
    };

    return NextResponse.json({
      success: true,
      data: {
        penetapan: serializedPenetapan,
        metadata,
        rek2Dict,
        rek3Dict,
        spmMaster
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
