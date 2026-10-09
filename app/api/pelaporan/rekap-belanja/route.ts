export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const isSuperAdmin = user.role === "superadmin" || user.level === 1;
    const { searchParams } = new URL(req.url);

    const bulanParam = searchParams.get("bulan");
    const bulan = bulanParam ? parseInt(bulanParam) : new Date().getMonth() + 1; // 1-12
    const tahun = parseInt(searchParams.get("tahun") || new Date().getFullYear().toString());
    const tahunStr = tahun.toString();

    const kd_upt = isSuperAdmin
      ? (searchParams.get("kd_upt") || user.kd_upt || user.unit || "")
      : (user.kd_upt || user.unit || "");

    if (!kd_upt) {
      return NextResponse.json({ error: "Unit / UPT wajib dipilih" }, { status: 400 });
    }

    if (!bulan || bulan < 1 || bulan > 12) {
      return NextResponse.json({ error: "Bulan harus dipilih (Januari - Desember)" }, { status: 400 });
    }

    // 1. Fetch Informasi Unit / UPT
    const upt = await prisma.msUpt.findFirst({
      where: { kd_upt },
    });

    // 2. Fetch Penandatangan (KPA / Pengguna Anggaran kode 1, Bendahara Pengeluaran kode 5)
    const penandatanganKpa = await prisma.penandatangan.findFirst({
      where: {
        kd_upt: kd_upt,
        kode: 1,
        status: 1,
      },
      orderBy: { id: "desc" },
    });

    const penandatanganBendahara = await prisma.penandatangan.findFirst({
      where: {
        kd_upt: kd_upt,
        kode: 5,
        status: 1,
      },
      orderBy: { id: "desc" },
    });

    // 3. Ambil data Anggaran Belanja (Pagu Aktif Rekening Belanja '5')
    // Sesuai aturan sistem: HANYA DOKUMEN RBA PENETAPAN YANG BERSTATUS AKTIF (is_aktif = true)
    const rbaList = await prisma.tblRbaPenetapan.findMany({
      where: {
        kdUnit: kd_upt,
        tahun: tahunStr,
        is_aktif: true,
      },
      include: {
        rincian: true,
      },
    });

    // Ambil master program, kegiatan, sub kegiatan & rekening untuk mapping hierarki & nama resmi
    const [mProgList, mGiatList, mSubGiatList, msRekList] = await Promise.all([
      prisma.mProg.findMany(),
      prisma.mGiat.findMany(),
      prisma.mSubGiat.findMany(),
      prisma.msRek6.findMany({ select: { kd_rek6: true, nm_rek6: true } }),
    ]);

    const progMap = new Map<string, string>();
    mProgList.forEach((p) => {
      if (p.kd_program) progMap.set(p.kd_program.trim(), p.nm_program || "");
    });

    const giatMap = new Map<string, { nm: string; kdProg: string }>();
    mGiatList.forEach((g) => {
      if (g.kd_kegiatan) {
        giatMap.set(g.kd_kegiatan.trim(), {
          nm: g.nm_kegiatan || "",
          kdProg: (g.kd_program || "").trim(),
        });
      }
    });

    const subGiatMap = new Map<string, { nm: string; kdGiat: string; kdProg: string }>();
    mSubGiatList.forEach((sg) => {
      if (sg.kd_sub_kegiatan) {
        subGiatMap.set(sg.kd_sub_kegiatan.trim(), {
          nm: sg.nm_sub_kegiatan || "",
          kdGiat: (sg.kd_kegiatan || "").trim(),
          kdProg: (sg.kd_program || "").trim(),
        });
      }
    });

    const rekNameMap = new Map<string, string>();
    msRekList.forEach((r) => {
      if (r.kd_rek6) rekNameMap.set(r.kd_rek6.trim(), r.nm_rek6 || "");
    });

    // 4. Ambil seluruh data realisasi pengeluaran belanja s/d bulan yang dipilih pada tahun anggaran
    const startDateYear = new Date(Date.UTC(tahun, 0, 1, 0, 0, 0));
    const endDateChosenMonth = new Date(Date.UTC(tahun, bulan, 1, 0, 0, 0));
    const startDateMonth = new Date(Date.UTC(tahun, bulan - 1, 1, 0, 0, 0));

    const allPengeluaran = await prisma.pengeluaran.findMany({
      where: {
        kd_upt: kd_upt,
        OR: [
          {
            tgl_pengeluaran: {
              gte: startDateYear,
              lt: endDateChosenMonth,
            },
          },
          {
            tahun: tahunStr,
            tgl_pengeluaran: {
              lt: endDateChosenMonth,
            },
          },
        ],
      },
      include: {
        rincian: true,
      },
      orderBy: [{ tgl_pengeluaran: "asc" }, { id: "asc" }],
    });

    // Klasifikasikan sumber dana menjadi 4 kelompok kolom utama: APBD, BLUD, BOK, JKN
    // Fungsi normalisasi kelompok dana
    const normalizeSumdanGroup = (rawSumdan?: string | null): "APBD" | "BLUD" | "BOK" | "JKN" => {
      if (!rawSumdan) return "BLUD";
      const s = rawSumdan.toUpperCase();
      if (s.includes("BOK") || s.includes("DAK NON FISIK") || s.includes("BANTUAN OPERASIONAL")) return "BOK";
      if (s.includes("JKN") || s.includes("KAPITASI") || s.includes("BPJS")) return "JKN";
      if (s.includes("APBD") || s.includes("DAU") || s.includes("PAD") || s.includes("DBH")) return "APBD";
      return "BLUD";
    };

    // Struktur Pohon Hirarki:
    // Program -> Kegiatan -> Sub Kegiatan -> Rekening (Kode Rekening)
    interface RekItem {
      kode: string;
      uraian: string;
      jumlahAnggaran: number;
      apbdLalu: number;
      apbdIni: number;
      bludLalu: number;
      bludIni: number;
      bokLalu: number;
      bokIni: number;
      jknLalu: number;
      jknIni: number;
    }

    interface SubGiatNode {
      kode: string;
      uraian: string;
      rekeningMap: Map<string, RekItem>;
    }

    interface GiatNode {
      kode: string;
      uraian: string;
      subGiatMap: Map<string, SubGiatNode>;
    }

    interface ProgNode {
      kode: string;
      uraian: string;
      giatMap: Map<string, GiatNode>;
    }

    const progTree = new Map<string, ProgNode>();

    // Helper untuk memastikan path di pohon ada
    const ensurePath = (
      kdProg: string,
      nmProg: string,
      kdGiat: string,
      nmGiat: string,
      kdSub: string,
      nmSub: string
    ): { prog: ProgNode; giat: GiatNode; sub: SubGiatNode } => {
      const cleanProg = kdProg || "1.01.01.2.22.0.00.01.00.00";
      const cleanGiat = kdGiat || `${cleanProg}.01`;
      const cleanSub = kdSub || `${cleanGiat}.01`;

      if (!progTree.has(cleanProg)) {
        progTree.set(cleanProg, {
          kode: cleanProg,
          uraian: nmProg || progMap.get(cleanProg) || "PROGRAM KESEHATAN",
          giatMap: new Map(),
        });
      }
      const prog = progTree.get(cleanProg)!;

      if (!prog.giatMap.has(cleanGiat)) {
        prog.giatMap.set(cleanGiat, {
          kode: cleanGiat,
          uraian: nmGiat || giatMap.get(cleanGiat)?.nm || "KEGIATAN PELAYANAN KESEHATAN",
          subGiatMap: new Map(),
        });
      }
      const giat = prog.giatMap.get(cleanGiat)!;

      if (!giat.subGiatMap.has(cleanSub)) {
        giat.subGiatMap.set(cleanSub, {
          kode: cleanSub,
          uraian: nmSub || subGiatMap.get(cleanSub)?.nm || "SUB KEGIATAN PELAYANAN",
          rekeningMap: new Map(),
        });
      }
      const sub = giat.subGiatMap.get(cleanSub)!;

      return { prog, giat, sub };
    };

    // Helper untuk ekstraksi kode hirarki dari Sub Kegiatan
    const parseHierarchyFromSub = (kdSub?: string | null, nmSub?: string | null) => {
      const subKey = (kdSub || "").trim();
      const meta = subGiatMap.get(subKey);

      let kdProg = meta?.kdProg || "";
      let kdGiat = meta?.kdGiat || "";
      let nmProg = kdProg ? progMap.get(kdProg) || "" : "";
      let nmGiat = kdGiat ? giatMap.get(kdGiat)?.nm || "" : "";

      // Jika belum ditemukan di master, coba cari pola standar
      if (!kdProg && subKey.includes(".")) {
        const parts = subKey.split(".");
        if (parts.length >= 3) {
          kdProg = parts.slice(0, 3).join(".");
        }
        if (parts.length >= 4) {
          kdGiat = parts.slice(0, 4).join(".");
        }
      }

      if (!kdProg) kdProg = "1.02.01";
      if (!kdGiat) kdGiat = `${kdProg}.2.01`;

      return {
        kdProg,
        nmProg: nmProg || "PROGRAM PEMENUHAN UPAYA KESEHATAN PERORANGAN DAN UPAYA KESEHATAN MASYARAKAT",
        kdGiat,
        nmGiat: nmGiat || "Penyediaan Fasilitas Pelayanan Kesehatan untuk UKM dan UKP Kewenangan Daerah Kabupaten/Kota",
        kdSub: subKey || `${kdGiat}.01`,
        nmSub: nmSub || meta?.nm || "Pelayanan dan Penunjang Pelayanan BLUD",
      };
    };

    // A. Masukkan Data Anggaran dari RBA
    if (rbaList.length > 0) {
      rbaList.forEach((penetapan) => {
        const { kdProg, nmProg, kdGiat, nmGiat, kdSub, nmSub } = parseHierarchyFromSub(
          penetapan.kdSubKegiatan,
          penetapan.nmSubKegiatan
        );

        const { sub } = ensurePath(kdProg, nmProg, kdGiat, nmGiat, kdSub, nmSub);

        if (penetapan.rincian && penetapan.rincian.length > 0) {
          penetapan.rincian.forEach((r) => {
            const kdRek = (r.kd_rek6 || "5.1.02.99.99.9999").trim();
            // Hanya akun belanja (kode 5)
            if (!kdRek.startsWith("5")) return;

            const nmRek = r.nm_rek6 || rekNameMap.get(kdRek) || r.uraian || "Belanja";
            const nilaiAnggaran = Number(r.total) || Number(r.nilai) || 0;

            if (!sub.rekeningMap.has(kdRek)) {
              sub.rekeningMap.set(kdRek, {
                kode: kdRek,
                uraian: nmRek,
                jumlahAnggaran: 0,
                apbdLalu: 0,
                apbdIni: 0,
                bludLalu: 0,
                bludIni: 0,
                bokLalu: 0,
                bokIni: 0,
                jknLalu: 0,
                jknIni: 0,
              });
            }

            const rekItem = sub.rekeningMap.get(kdRek)!;
            rekItem.jumlahAnggaran += nilaiAnggaran;
          });
        } else {
          // Bila rincian belum dipecah, gunakan pagu header penetapan
          const kdRek = (penetapan.kd_rek6 || "5.1.02.99.99.9999").trim();
          if (kdRek.startsWith("5")) {
            const nmRek = penetapan.nm_rek6 || rekNameMap.get(kdRek) || "Belanja";
            const nilaiAnggaran = Number(penetapan.nilai) || 0;

            if (!sub.rekeningMap.has(kdRek)) {
              sub.rekeningMap.set(kdRek, {
                kode: kdRek,
                uraian: nmRek,
                jumlahAnggaran: 0,
                apbdLalu: 0,
                apbdIni: 0,
                bludLalu: 0,
                bludIni: 0,
                bokLalu: 0,
                bokIni: 0,
                jknLalu: 0,
                jknIni: 0,
              });
            }
            sub.rekeningMap.get(kdRek)!.jumlahAnggaran += nilaiAnggaran;
          }
        }
      });
    }

    // B. Masukkan Realisasi Pengeluaran ke dalam Pohon
    allPengeluaran.forEach((peng) => {
      const tgl = peng.tgl_pengeluaran ? new Date(peng.tgl_pengeluaran) : new Date(startDateMonth);
      const isCurrentMonth = tgl >= startDateMonth && tgl < endDateChosenMonth;
      const isPastMonth = tgl < startDateMonth;

      if (!isCurrentMonth && !isPastMonth) return;

      const pengSumdanGroup = normalizeSumdanGroup(peng.sumdan);

      if (peng.rincian && peng.rincian.length > 0) {
        peng.rincian.forEach((r) => {
          const nominal = Number(r.total) || 0;
          if (nominal === 0) return;

          const kdRek = (r.kd_rek6 || peng.kd_rek6 || "5.1.02.99.99.9999").trim();
          // Hanya akun belanja (kode 5)
          if (!kdRek.startsWith("5")) return;

          const rSumdanGroup = normalizeSumdanGroup(r.sumdan || peng.sumdan);
          const { kdProg, nmProg, kdGiat, nmGiat, kdSub, nmSub } = parseHierarchyFromSub(
            r.kd_sub_kegiatan || peng.kd_sub_kegiatan,
            r.nm_sub_kegiatan || peng.nm_sub_kegiatan
          );

          const { sub } = ensurePath(kdProg, nmProg, kdGiat, nmGiat, kdSub, nmSub);
          const nmRek = r.nm_rek6 || peng.nm_rek6 || rekNameMap.get(kdRek) || r.uraian || "Belanja";

          if (!sub.rekeningMap.has(kdRek)) {
            sub.rekeningMap.set(kdRek, {
              kode: kdRek,
              uraian: nmRek,
              jumlahAnggaran: 0,
              apbdLalu: 0,
              apbdIni: 0,
              bludLalu: 0,
              bludIni: 0,
              bokLalu: 0,
              bokIni: 0,
              jknLalu: 0,
              jknIni: 0,
            });
          }

          const rekItem = sub.rekeningMap.get(kdRek)!;
          if (rSumdanGroup === "APBD") {
            if (isPastMonth) rekItem.apbdLalu += nominal;
            else rekItem.apbdIni += nominal;
          } else if (rSumdanGroup === "BOK") {
            if (isPastMonth) rekItem.bokLalu += nominal;
            else rekItem.bokIni += nominal;
          } else if (rSumdanGroup === "JKN") {
            if (isPastMonth) rekItem.jknLalu += nominal;
            else rekItem.jknIni += nominal;
          } else {
            // BLUD
            if (isPastMonth) rekItem.bludLalu += nominal;
            else rekItem.bludIni += nominal;
          }
        });
      } else {
        const nominal = Number(peng.nilai_pengeluaran) || 0;
        if (nominal === 0) return;

        const kdRek = (peng.kd_rek6 || "5.1.02.99.99.9999").trim();
        // Hanya akun belanja (kode 5)
        if (!kdRek.startsWith("5")) return;

        const { kdProg, nmProg, kdGiat, nmGiat, kdSub, nmSub } = parseHierarchyFromSub(
          peng.kd_sub_kegiatan,
          peng.nm_sub_kegiatan
        );

        const { sub } = ensurePath(kdProg, nmProg, kdGiat, nmGiat, kdSub, nmSub);
        const nmRek = peng.nm_rek6 || rekNameMap.get(kdRek) || peng.keterangan || "Belanja";

        if (!sub.rekeningMap.has(kdRek)) {
          sub.rekeningMap.set(kdRek, {
            kode: kdRek,
            uraian: nmRek,
            jumlahAnggaran: 0,
            apbdLalu: 0,
            apbdIni: 0,
            bludLalu: 0,
            bludIni: 0,
            bokLalu: 0,
            bokIni: 0,
            jknLalu: 0,
            jknIni: 0,
          });
        }

        const rekItem = sub.rekeningMap.get(kdRek)!;
        if (pengSumdanGroup === "APBD") {
          if (isPastMonth) rekItem.apbdLalu += nominal;
          else rekItem.apbdIni += nominal;
        } else if (pengSumdanGroup === "BOK") {
          if (isPastMonth) rekItem.bokLalu += nominal;
          else rekItem.bokIni += nominal;
        } else if (pengSumdanGroup === "JKN") {
          if (isPastMonth) rekItem.jknLalu += nominal;
          else rekItem.jknIni += nominal;
        } else {
          // BLUD
          if (isPastMonth) rekItem.bludLalu += nominal;
          else rekItem.bludIni += nominal;
        }
      }
    });

    // C. Flatten Pohon menjadi baris tabel siap cetak dengan subtotal bertingkat
    interface ReportRow {
      id: string;
      level: "program" | "kegiatan" | "sub_kegiatan" | "rekening";
      kode: string;
      uraian: string;
      jumlahAnggaran: number;
      // APBD
      apbdLalu: number;
      apbdIni: number;
      apbdSdIni: number;
      // BLUD
      bludLalu: number;
      bludIni: number;
      bludSdIni: number;
      // BOK
      bokLalu: number;
      bokIni: number;
      bokSdIni: number;
      // JKN
      jknLalu: number;
      jknIni: number;
      jknSdIni: number;
      // TOTAL & SISA
      totalSpj: number;
      sisaAnggaran: number;
    }

    const rows: ReportRow[] = [];

    // Grand totals
    let grandAnggaran = 0;
    let grandApbdLalu = 0;
    let grandApbdIni = 0;
    let grandBludLalu = 0;
    let grandBludIni = 0;
    let grandBokLalu = 0;
    let grandBokIni = 0;
    let grandJknLalu = 0;
    let grandJknIni = 0;

    const sortedProgKeys = Array.from(progTree.keys()).sort();

    for (const progKey of sortedProgKeys) {
      const prog = progTree.get(progKey)!;

      let progAnggaran = 0;
      let progApbdLalu = 0;
      let progApbdIni = 0;
      let progBludLalu = 0;
      let progBludIni = 0;
      let progBokLalu = 0;
      let progBokIni = 0;
      let progJknLalu = 0;
      let progJknIni = 0;

      const progRowsTemp: ReportRow[] = [];

      const sortedGiatKeys = Array.from(prog.giatMap.keys()).sort();
      for (const giatKey of sortedGiatKeys) {
        const giat = prog.giatMap.get(giatKey)!;
        const giatText = `${giat.kode} ${giat.uraian}`.toUpperCase();
        if (giatText.includes("PENDAPATAN") || giatText.includes("PEMBIAYAAN") || giatText.includes("SILPA")) {
          continue;
        }

        let giatAnggaran = 0;
        let giatApbdLalu = 0;
        let giatApbdIni = 0;
        let giatBludLalu = 0;
        let giatBludIni = 0;
        let giatBokLalu = 0;
        let giatBokIni = 0;
        let giatJknLalu = 0;
        let giatJknIni = 0;

        const giatRowsTemp: ReportRow[] = [];

        const sortedSubKeys = Array.from(giat.subGiatMap.keys()).sort();
        for (const subKey of sortedSubKeys) {
          const sub = giat.subGiatMap.get(subKey)!;
          const subText = `${sub.kode} ${sub.uraian}`.toUpperCase();
          if (subText.includes("PENDAPATAN") || subText.includes("PEMBIAYAAN") || subText.includes("SILPA")) {
            continue;
          }

          // Lewati jika sub kegiatan tidak memiliki rincian rekening belanja sama sekali
          if (sub.rekeningMap.size === 0) {
            continue;
          }

          let subAnggaran = 0;
          let subApbdLalu = 0;
          let subApbdIni = 0;
          let subBludLalu = 0;
          let subBludIni = 0;
          let subBokLalu = 0;
          let subBokIni = 0;
          let subJknLalu = 0;
          let subJknIni = 0;

          const rekRowsTemp: ReportRow[] = [];

          const sortedRekKeys = Array.from(sub.rekeningMap.keys()).sort();
          for (const rekKey of sortedRekKeys) {
            const item = sub.rekeningMap.get(rekKey)!;
            // Pastikan rekening belanja (dimulai 5)
            if (!item.kode.startsWith("5")) continue;

            const apbdSdIni = item.apbdLalu + item.apbdIni;
            const bludSdIni = item.bludLalu + item.bludIni;
            const bokSdIni = item.bokLalu + item.bokIni;
            const jknSdIni = item.jknLalu + item.jknIni;
            const totalSpj = apbdSdIni + bludSdIni + bokSdIni + jknSdIni;
            const sisaAnggaran = item.jumlahAnggaran - totalSpj;

            rekRowsTemp.push({
              id: `rek-${subKey}-${item.kode}`,
              level: "rekening",
              kode: item.kode,
              uraian: item.uraian,
              jumlahAnggaran: item.jumlahAnggaran,
              apbdLalu: item.apbdLalu,
              apbdIni: item.apbdIni,
              apbdSdIni,
              bludLalu: item.bludLalu,
              bludIni: item.bludIni,
              bludSdIni,
              bokLalu: item.bokLalu,
              bokIni: item.bokIni,
              bokSdIni,
              jknLalu: item.jknLalu,
              jknIni: item.jknIni,
              jknSdIni,
              totalSpj,
              sisaAnggaran,
            });

            subAnggaran += item.jumlahAnggaran;
            subApbdLalu += item.apbdLalu;
            subApbdIni += item.apbdIni;
            subBludLalu += item.bludLalu;
            subBludIni += item.bludIni;
            subBokLalu += item.bokLalu;
            subBokIni += item.bokIni;
            subJknLalu += item.jknLalu;
            subJknIni += item.jknIni;
          }

          if (rekRowsTemp.length === 0) continue;

          const subApbdSdIni = subApbdLalu + subApbdIni;
          const subBludSdIni = subBludLalu + subBludIni;
          const subBokSdIni = subBokLalu + subBokIni;
          const subJknSdIni = subJknLalu + subJknIni;
          const subTotalSpj = subApbdSdIni + subBludSdIni + subBokSdIni + subJknSdIni;
          const subSisaAnggaran = subAnggaran - subTotalSpj;

          giatRowsTemp.push({
            id: `sub-${subKey}`,
            level: "sub_kegiatan",
            kode: sub.kode,
            uraian: sub.uraian,
            jumlahAnggaran: subAnggaran,
            apbdLalu: subApbdLalu,
            apbdIni: subApbdIni,
            apbdSdIni: subApbdSdIni,
            bludLalu: subBludLalu,
            bludIni: subBludIni,
            bludSdIni: subBludSdIni,
            bokLalu: subBokLalu,
            bokIni: subBokIni,
            bokSdIni: subBokSdIni,
            jknLalu: subJknLalu,
            jknIni: subJknIni,
            jknSdIni: subJknSdIni,
            totalSpj: subTotalSpj,
            sisaAnggaran: subSisaAnggaran,
          });

          giatRowsTemp.push(...rekRowsTemp);

          giatAnggaran += subAnggaran;
          giatApbdLalu += subApbdLalu;
          giatApbdIni += subApbdIni;
          giatBludLalu += subBludLalu;
          giatBludIni += subBludIni;
          giatBokLalu += subBokLalu;
          giatBokIni += subBokIni;
          giatJknLalu += subJknLalu;
          giatJknIni += subJknIni;
        }

        if (giatRowsTemp.length === 0) continue;

        const giatApbdSdIni = giatApbdLalu + giatApbdIni;
        const giatBludSdIni = giatBludLalu + giatBludIni;
        const giatBokSdIni = giatBokLalu + giatBokIni;
        const giatJknSdIni = giatJknLalu + giatJknIni;
        const giatTotalSpj = giatApbdSdIni + giatBludSdIni + giatBokSdIni + giatJknSdIni;
        const giatSisaAnggaran = giatAnggaran - giatTotalSpj;

        progRowsTemp.push({
          id: `giat-${giatKey}`,
          level: "kegiatan",
          kode: giat.kode,
          uraian: giat.uraian,
          jumlahAnggaran: giatAnggaran,
          apbdLalu: giatApbdLalu,
          apbdIni: giatApbdIni,
          apbdSdIni: giatApbdSdIni,
          bludLalu: giatBludLalu,
          bludIni: giatBludIni,
          bludSdIni: giatBludSdIni,
          bokLalu: giatBokLalu,
          bokIni: giatBokIni,
          bokSdIni: giatBokSdIni,
          jknLalu: giatJknLalu,
          jknIni: giatJknIni,
          jknSdIni: giatJknSdIni,
          totalSpj: giatTotalSpj,
          sisaAnggaran: giatSisaAnggaran,
        });

        progRowsTemp.push(...giatRowsTemp);

        progAnggaran += giatAnggaran;
        progApbdLalu += giatApbdLalu;
        progApbdIni += giatApbdIni;
        progBludLalu += giatBludLalu;
        progBludIni += giatBludIni;
        progBokLalu += giatBokLalu;
        progBokIni += giatBokIni;
        progJknLalu += giatJknLalu;
        progJknIni += giatJknIni;
      }

      if (progRowsTemp.length === 0) continue;

      const progApbdSdIni = progApbdLalu + progApbdIni;
      const progBludSdIni = progBludLalu + progBludIni;
      const progBokSdIni = progBokLalu + progBokIni;
      const progJknSdIni = progJknLalu + progJknIni;
      const progTotalSpj = progApbdSdIni + progBludSdIni + progBokSdIni + progJknSdIni;
      const progSisaAnggaran = progAnggaran - progTotalSpj;

      rows.push({
        id: `prog-${progKey}`,
        level: "program",
        kode: prog.kode,
        uraian: prog.uraian,
        jumlahAnggaran: progAnggaran,
        apbdLalu: progApbdLalu,
        apbdIni: progApbdIni,
        apbdSdIni: progApbdSdIni,
        bludLalu: progBludLalu,
        bludIni: progBludIni,
        bludSdIni: progBludSdIni,
        bokLalu: progBokLalu,
        bokIni: progBokIni,
        bokSdIni: progBokSdIni,
        jknLalu: progJknLalu,
        jknIni: progJknIni,
        jknSdIni: progJknSdIni,
        totalSpj: progTotalSpj,
        sisaAnggaran: progSisaAnggaran,
      });

      rows.push(...progRowsTemp);

      grandAnggaran += progAnggaran;
      grandApbdLalu += progApbdLalu;
      grandApbdIni += progApbdIni;
      grandBludLalu += progBludLalu;
      grandBludIni += progBludIni;
      grandBokLalu += progBokLalu;
      grandBokIni += progBokIni;
      grandJknLalu += progJknLalu;
      grandJknIni += progJknIni;
    }

    const grandApbdSdIni = grandApbdLalu + grandApbdIni;
    const grandBludSdIni = grandBludLalu + grandBludIni;
    const grandBokSdIni = grandBokLalu + grandBokIni;
    const grandJknSdIni = grandJknLalu + grandJknIni;
    const grandTotalSpj = grandApbdSdIni + grandBludSdIni + grandBokSdIni + grandJknSdIni;
    const grandSisaAnggaran = grandAnggaran - grandTotalSpj;

    return NextResponse.json({
      success: true,
      bulan,
      tahun,
      kd_upt,
      upt,
      penandatanganKpa,
      penandatanganBendahara,
      rows,
      summary: {
        grandAnggaran,
        grandApbdLalu,
        grandApbdIni,
        grandApbdSdIni,
        grandBludLalu,
        grandBludIni,
        grandBludSdIni,
        grandBokLalu,
        grandBokIni,
        grandBokSdIni,
        grandJknLalu,
        grandJknIni,
        grandJknSdIni,
        grandTotalSpj,
        grandSisaAnggaran,
      },
    });
  } catch (error: any) {
    console.error("Rekap Belanja API Error:", error);
    return NextResponse.json({ error: error.message || "Gagal memuat data Rekapitulasi Belanja" }, { status: 500 });
  }
}
