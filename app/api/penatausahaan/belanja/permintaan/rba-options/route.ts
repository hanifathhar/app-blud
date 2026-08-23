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

    if (!tahun || !kd_upt) {
      return NextResponse.json({ error: "Tahun and UPT required" }, { status: 400 });
    }

    // Get all active penetapan rincian for this unit and year
    const rbaItems = await prisma.tblRbaRincianPenetapan.findMany({
      where: {
        tahun,
        kdUnit: kd_upt,
        rba_penetapan: {
          is_aktif: true,
        },
      },
    });

    // Group by UKM -> SPM for the Header options
    const headerGroups = new Map();

    rbaItems.forEach((item: any) => {
      // Hanya ambil yang rekening belanjanya berawalan "5" (Belanja), skip Pendapatan (4) & Pembiayaan (6)
      if (!item.kd_rek6 || !item.kd_rek6.startsWith("5")) return;

      const key = `${item.kdUkm}-${item.kdPeruntukan}-${item.kdKomponen}-${item.kdRincian}-${item.kdSubKegiatan}-${item.kdSpm}`;
      
      if (!headerGroups.has(key)) {
        headerGroups.set(key, {
          kd_ukm: item.kdUkm,
          nm_ukm: item.nmUkm,
          kd_peruntukan: item.kdPeruntukan,
          nm_peruntukan: item.nmPeruntukan,
          kd_komponen: item.kdKomponen,
          nm_komponen: item.nmKomponen,
          kd_rincian: item.kdRincian,
          nm_rincian: item.nmRincian,
          kd_sub_kegiatan: item.kdSubKegiatan,
          nm_sub_kegiatan: item.nmSubKegiatan,
          kd_spm: item.kdSpm,
          nm_spm: item.nmSpm,
          rekenings: [],
        });
      }

      const group = headerGroups.get(key);
      
      // Check for duplicate rekenings inside the same group, sum the values if needed
      // but usually they might just be listed per line, let's just push it for now, 
      // or we can deduplicate if a rekening appears multiple times in the same sub_kegiatan.
      // Usually we want unique rekenings in the dropdown for the user to choose.
      const existingRek = group.rekenings.find((r: any) => r.kd_rek6 === item.kd_rek6);
      if (existingRek) {
        existingRek.pagu += Number(item.total || item.nilai || 0); // TblRbaRincianPenetapan usually uses `total` for sum
      } else {
        group.rekenings.push({
          kd_rek6: item.kd_rek6,
          nm_rek6: item.nm_rek6,
          pagu: Number(item.total || item.nilai || 0),
          sumdan: item.sumdan,
        });
      }
    });

    // Remove groups that have no rekenings (though we already filtered above)
    const data = Array.from(headerGroups.values()).filter(g => g.rekenings.length > 0);

    return NextResponse.json({ data });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
