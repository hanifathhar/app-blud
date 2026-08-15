import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";
import crypto from "crypto";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const searchParams = req.nextUrl.searchParams;
    const q = searchParams.get("q") || "";
    
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;
    const tahun = searchParams.get("tahun") || auth.tahun || new Date().getFullYear().toString();

    const where: any = { 
      tahun,
      nmSubKegiatan: {
        contains: "pendapatan",
        mode: "insensitive"
      }
    };
    
    // Non superadmin only sees their own UPT's data
    if (auth.role !== "superadmin") {
      where.kdUpt = auth.kd_upt;
    } else {
      const kd_upt = searchParams.get("kd_upt");
      if (kd_upt) where.kdUpt = kd_upt;
    }

    if (q) {
      where.AND = [
        {
          OR: [
            { noPuk: { contains: q, mode: "insensitive" } },
            { nmSubKegiatan: { contains: q, mode: "insensitive" } },
          ]
        }
      ];
    }

    const [dataRaw, total, summaryRaw, grandTotalRaw] = await Promise.all([
      prisma.tblPuk.findMany({
        where,
        skip,
        take: limit,
        orderBy: { tglUpdate: "desc" }
      }),
      prisma.tblPuk.count({ where }),
      prisma.tblPuk.groupBy({
        by: ['sumdan'],
        where,
        _sum: { nilai: true }
      }),
      prisma.tblPuk.aggregate({
        where,
        _sum: { nilai: true }
      })
    ]);

    const kdUpts = Array.from(new Set(dataRaw.map(d => d.kdUpt).filter(Boolean) as string[]));
    const upts = await prisma.msUpt.findMany({
      where: { kd_upt: { in: kdUpts } }
    });
    const uptMap = new Map(upts.map(u => [u.kd_upt, u.nm_upt]));
    
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
        nmUpt: (d.kdUpt && uptMap.has(d.kdUpt)) ? uptMap.get(d.kdUpt) : d.nmUpt,
        kdProgram: related?.kd_program || null,
        nmProgram: related?.nm_program || "-",
        kdKegiatan: related?.kd_kegiatan || null,
        nmKegiatan: related?.nm_kegiatan || "-"
      };
    });

    const summaryBySumdan = summaryRaw.map(s => ({
      sumdan: s.sumdan || 'Belum Ditentukan',
      total: Number(s._sum.nilai) || 0
    }));

    const grandTotal = grandTotalRaw._sum.nilai ? Number(grandTotalRaw._sum.nilai) : 0;

    return NextResponse.json({ 
      data, 
      summaryBySumdan,
      grandTotal,
      pagination: { 
        total, 
        page, 
        limit, 
        totalPages: Math.ceil(total / limit) 
      } 
    });
  } catch (error) {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}


export async function POST(req: NextRequest) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth || !["superadmin", "kpa", "perencana"].includes(auth.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const kd_upt = auth.role === "superadmin" ? body.kdUpt : auth.kd_upt;
    const nm_upt = auth.role === "superadmin" ? body.nmUpt : auth.upt?.nm_upt || "";
    const tahun = body.tahun || new Date().getFullYear().toString();
    
    // Generate No PUK
    const noPuk = `${kd_upt || ""}${body.kdUkm || ""}${body.kdPeruntukan || ""}${body.kdKomponen || ""}${body.kdRincian || ""}${body.kdSubKegiatan || ""}`;
    
    // Cek apakah No PUK sudah ada
    const existing = await prisma.tblPuk.findUnique({ where: { noPuk } });
    if (existing) {
      return NextResponse.json({ error: `Kombinasi kegiatan ini sudah pernah diinput. Silakan pilih kombinasi kegiatan yang berbeda.` }, { status: 400 });
    }

    const id = crypto.randomUUID();

    const created = await prisma.tblPuk.create({
      data: {
        id,
        noPuk,
        kdUpt: kd_upt,
        nmUpt: nm_upt,
        kdUkm: "",
        nmUkm: "",
        kdPeruntukan: "",
        nmPeruntukan: "",
        kdKomponen: "",
        nmKomponen: "",
        kdRincian: "",
        nmRincian: "",
        kdSubKegiatan: body.kdSubKegiatan,
        nmSubKegiatan: body.nmSubKegiatan,
        kdSpm: null,
        nmSpm: "",
        tujuan: body.tujuan,
        sasaran: body.sasaran,
        targetSasaran: body.targetSasaran,
        targetObjek: body.targetObjek ? parseInt(body.targetObjek) : null,
        penanggungjawab: body.penanggungjawab,
        nilai: body.nilai ? parseFloat(body.nilai) : 0,
        jan: body.jan ? parseFloat(body.jan) : 0,
        feb: body.feb ? parseFloat(body.feb) : 0,
        mar: body.mar ? parseFloat(body.mar) : 0,
        apr: body.apr ? parseFloat(body.apr) : 0,
        mei: body.mei ? parseFloat(body.mei) : 0,
        jun: body.jun ? parseFloat(body.jun) : 0,
        jul: body.jul ? parseFloat(body.jul) : 0,
        agus: body.agus ? parseFloat(body.agus) : 0,
        sep: body.sep ? parseFloat(body.sep) : 0,
        okt: body.okt ? parseFloat(body.okt) : 0,
        nov: body.nov ? parseFloat(body.nov) : 0,
        des: body.des ? parseFloat(body.des) : 0,
        lokasi: body.lokasi,
        sumdan: "",
        username: auth.username,
        tglUpdate: new Date(),
        aksi: "CREATE",
        tahun,
      }
    });

    return NextResponse.json({ message: "Data PUK berhasil ditambahkan", data: created });
  } catch (error: any) {
    console.error("POST PUK Error:", error);
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server" }, { status: 500 });
  }
}

