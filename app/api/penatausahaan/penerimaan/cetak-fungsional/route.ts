import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const kd_upt = searchParams.get("kd_upt") || user.kd_upt;
    const tahun = searchParams.get("tahun") || new Date().getFullYear().toString();
    const bulan = searchParams.get("bulan") || (new Date().getMonth() + 1).toString();

    const whereUpt = user.role !== "superadmin" ? user.kd_upt : (kd_upt ? kd_upt : undefined);

    // 1. Get Master Rekening (Level 3, 4, 5, 6 for Pendapatan starts with 4)
    const msRek3 = await prisma.msRek3.findMany({ where: { kd_rek3: { startsWith: "4" } } });
    const msRek4 = await prisma.msRek4.findMany({ where: { kd_rek4: { startsWith: "4" } } });
    const msRek5 = await prisma.msRek5.findMany({ where: { kd_rek5: { startsWith: "4" } } });
    const msRek6 = await prisma.msRek6.findMany({ where: { kd_rek6: { startsWith: "4" } } });

    const rekeningMap = new Map();
    msRek3.forEach(r => rekeningMap.set(r.kd_rek3, { kode: r.kd_rek3, nama: r.nm_rek3, level: 3, isLeaf: false }));
    msRek4.forEach(r => rekeningMap.set(r.kd_rek4, { kode: r.kd_rek4, nama: r.nm_rek4, level: 4, isLeaf: false }));
    msRek5.forEach(r => rekeningMap.set(r.kd_rek5, { kode: r.kd_rek5, nama: r.nm_rek5, level: 5, isLeaf: false }));
    msRek6.forEach(r => rekeningMap.set(r.kd_rek6, { kode: r.kd_rek6, nama: r.nm_rek6, level: 6, isLeaf: true }));

    // 2. Fetch Anggaran (TblRbaRincianPenetapan)
    const anggaranWhere: any = { tahun, kd_rek6: { startsWith: "4" } };
    if (whereUpt) anggaranWhere.kdUnit = whereUpt;
    const anggaranData = await prisma.tblRbaRincianPenetapan.groupBy({
      by: ['kd_rek6'],
      where: anggaranWhere,
      _sum: { nilai: true }
    });

    // 3. Fetch Realisasi (TblPenerimaan)
    // S/d Bulan Lalu
    const startDate = new Date(parseInt(tahun), 0, 1);
    const startOfCurrentMonth = new Date(parseInt(tahun), parseInt(bulan) - 1, 1);
    const startOfNextMonth = new Date(parseInt(tahun), parseInt(bulan), 1);

    const realisasiWhere: any = { tahun, verif: 1, kdRek6: { startsWith: "4" } };
    if (whereUpt) realisasiWhere.kdUnit = whereUpt;

    const realisasiBulanLaluData = await prisma.tblPenerimaan.groupBy({
      by: ['kdRek6'],
      where: {
        ...realisasiWhere,
        tglBukti: { gte: startDate, lt: startOfCurrentMonth }
      },
      _sum: { nilai: true }
    });

    const realisasiBulanIniData = await prisma.tblPenerimaan.groupBy({
      by: ['kdRek6'],
      where: {
        ...realisasiWhere,
        tglBukti: { gte: startOfCurrentMonth, lt: startOfNextMonth }
      },
      _sum: { nilai: true }
    });

    // 4. Build Hierarchy Tree
    const treeMap = new Map();

    // Helper to safely add to tree
    const ensureNode = (kode: string) => {
      if (!treeMap.has(kode)) {
        const meta = rekeningMap.get(kode) || { kode, nama: "Unknown", level: kode.split(".").length, isLeaf: false };
        treeMap.set(kode, {
          kode: meta.kode,
          nama: meta.nama,
          level: meta.level,
          isLeaf: meta.isLeaf,
          anggaran: 0,
          realisasiBulanLalu: 0,
          realisasiBulanIni: 0,
          realisasiSdHariIni: 0
        });
      }
      return treeMap.get(kode);
    };

    // Helper to propagate values upwards
    const propagateValue = (kode: string, field: "anggaran" | "realisasiBulanLalu" | "realisasiBulanIni", value: number) => {
      if (!value || value === 0) return;
      
      const parts = kode.split(".");
      for (let i = 3; i <= parts.length; i++) {
        const parentKode = parts.slice(0, i).join(".");
        const node = ensureNode(parentKode);
        node[field] += value;
        node.realisasiSdHariIni = node.realisasiBulanLalu + node.realisasiBulanIni;
      }
    };

    // Apply Anggaran
    anggaranData.forEach(item => {
      if (item.kd_rek6) propagateValue(item.kd_rek6, "anggaran", Number(item._sum.nilai || 0));
    });

    // Apply Realisasi Bulan Lalu
    realisasiBulanLaluData.forEach(item => {
      if (item.kdRek6) propagateValue(item.kdRek6, "realisasiBulanLalu", Number(item._sum.nilai || 0));
    });

    // Apply Realisasi Bulan Ini
    realisasiBulanIniData.forEach(item => {
      if (item.kdRek6) propagateValue(item.kdRek6, "realisasiBulanIni", Number(item._sum.nilai || 0));
    });

    // Include general Level 3 categories even if no data, to show structure
    msRek3.forEach(r => {
      if (r.kd_rek3) ensureNode(r.kd_rek3);
    });

    // Convert map to sorted array
    const sortedTree = Array.from(treeMap.values()).sort((a, b) => a.kode.localeCompare(b.kode));

    // Filter out rows that have no anggaran and no realisasi
    const filteredTree = sortedTree.filter(node => 
      node.anggaran !== 0 || node.realisasiSdHariIni !== 0
    );

    // 5. Get UPT Data for Header
    let uptInfo = null;
    if (whereUpt) {
      uptInfo = await prisma.msUpt.findFirst({ where: { kd_upt: whereUpt } });
    }

    return NextResponse.json({
      success: true,
      data: filteredTree,
      upt: uptInfo,
      tahun,
      bulan
    });

  } catch (error: any) {
    console.error("Cetak Fungsional Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
