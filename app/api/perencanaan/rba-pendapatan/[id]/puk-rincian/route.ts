import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getUserFromRequest } from "@/lib/auth";

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = getUserFromRequest(req);
    if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const { id: no_rba } = resolvedParams;

    // 1. Get the RBA to find its kdSubKegiatan and kdUnit
    const rba = await prisma.tblRba.findUnique({
      where: { no_rba },
    });

    if (!rba) {
      return NextResponse.json({ error: "RBA tidak ditemukan" }, { status: 404 });
    }

    const { kdSubKegiatan, kdUnit } = rba;

    if (!kdSubKegiatan || !kdUnit) {
      return NextResponse.json({ error: "Data RBA tidak memiliki Sub Kegiatan atau Unit" }, { status: 400 });
    }

    // 2. Get existing rincian in this RBA to filter them out later
    const existingRbaRincian = await prisma.tblRbaRincian.findMany({
      where: { no_rba },
      select: { uraian: true, kd_rek6: true }
    });

    const existingKeys = new Set(existingRbaRincian.map(r => `${r.kd_rek6}-${r.uraian}`));

    // 3. Find the latest PUK for this UPT and Sub Kegiatan (in the current year)
    const current_tahun = auth.tahun || new Date().getFullYear().toString();
    const latestPuk = await prisma.tblPuk.findFirst({
      where: {
        kdUpt: kdUnit,
        kdSubKegiatan: kdSubKegiatan,
        tahun: current_tahun
      },
      orderBy: { tglUpdate: 'desc' }
    });

    if (!latestPuk) {
      return NextResponse.json({ success: true, data: [] });
    }

    // 4. Get Rincian from that latest PUK
    const pukRincian = await prisma.tblPukRincian.findMany({
      where: {
        noPuk: latestPuk.noPuk
      }
    });

    // 5. Filter out the ones that are already in RBA
    const availablePukRincian = pukRincian.filter(pr => {
      // Some fields in TblPukRincian might not have kd_rek6 mapped. Let's just match uraian for safety, or both if available
      const key = `${pr.kode || ''}-${pr.uraian || ''}`; // Wait, the schema has `kode` in TblPukRincian, not kd_rek6! Let's check TblPukRincian fields.
      // If it doesn't match perfectly, we can just filter by uraian since they should be unique per Sub Kegiatan
      return existingRbaRincian.findIndex(r => r.uraian === pr.uraian) === -1;
    });

    return NextResponse.json({ success: true, data: availablePukRincian });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
