import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("mode") || "bulan"; // "tanggal" | "bulan"
    
    // Extract parameters
    const kd_upt = searchParams.get("kd_upt") || user.kd_upt;
    const tahun = searchParams.get("tahun") || new Date().getFullYear().toString();
    const bulan = searchParams.get("bulan"); // 1-12
    const tgl_awal = searchParams.get("tgl_awal");
    const tgl_akhir = searchParams.get("tgl_akhir");

    const where: any = {};
    
    if (user.role !== "superadmin") {
      where.kdUnit = user.kd_upt;
    } else if (kd_upt) {
      where.kdUnit = kd_upt;
    }

    if (mode === "bulan" && bulan) {
      where.tahun = tahun;
      // Note: tglBukti is DateTime. We need to filter by month and year.
      // We can construct a date range for the month.
      const startDate = new Date(parseInt(tahun), parseInt(bulan) - 1, 1);
      const endDate = new Date(parseInt(tahun), parseInt(bulan), 1);
      where.tglBukti = {
        gte: startDate,
        lt: endDate
      };
    } else if (mode === "tanggal" && tgl_awal && tgl_akhir) {
      const start = new Date(tgl_awal);
      const end = new Date(tgl_akhir);
      // To include the whole end day
      end.setHours(23, 59, 59, 999);
      
      where.tglBukti = {
        gte: start,
        lte: end
      };
    } else {
      // Default fallback
      where.tahun = tahun;
    }

    // Note: The user requested to include all receipts (verified and draft)
    // No filter on verif status.

    const data = await prisma.tblPenerimaan.findMany({
      where,
      orderBy: [
        { tglBukti: "asc" },
        { noBukti: "asc" }
      ],
    });

    // Get UPT details for the header
    let uptDetails = { kd_upt: kd_upt, nm_upt: "" };
    if (kd_upt) {
      // Trying to get name from the first record, since tbl_penerimaan stores nmUnit
      const firstRec = data.find((d: any) => d.nmUnit);
      if (firstRec) {
        uptDetails.nm_upt = firstRec.nmUnit || "";
      }
    }

    return NextResponse.json({
      success: true,
      data,
      upt: uptDetails,
      params: { mode, tahun, bulan, tgl_awal, tgl_akhir }
    });
  } catch (error: any) {
    console.error("Print API Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
