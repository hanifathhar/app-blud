"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Printer, FileText } from "lucide-react";

function formatCurrencyRupiah(val: number) {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val || 0);
}

const BULAN_NAMA = [
  "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

function getLastDayOfMonth(year: number, month: number) {
  const d = new Date(year, month, 0);
  return d.getDate();
}

function CetakRekapBelanjaContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paperSize, setPaperSize] = useState<"A4" | "Folio">("Folio");

  const bulan = searchParams.get("bulan") || (new Date().getMonth() + 1).toString();
  const tahun = searchParams.get("tahun") || new Date().getFullYear().toString();
  const kd_upt = searchParams.get("kd_upt") || "";

  const bulanNum = parseInt(bulan);
  const tahunNum = parseInt(tahun);

  useEffect(() => {
    const fetchCetak = async () => {
      try {
        const query = new URLSearchParams({
          tahun,
          kd_upt,
          bulan,
        });

        const res = await fetch(`/api/pelaporan/rekap-belanja?${query.toString()}`);
        const result = await res.json();

        if (res.ok && result.success) {
          setData(result);
          setTimeout(() => {
            window.print();
          }, 600);
        } else {
          setError(result.error || "Gagal memuat data cetak Rekapitulasi Belanja");
        }
      } catch (err: any) {
        setError("Terjadi kesalahan koneksi saat memuat dokumen cetak");
      } finally {
        setLoading(false);
      }
    };

    fetchCetak();
  }, [bulan, tahun, kd_upt]);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", fontFamily: "sans-serif" }}>
        Menyiapkan dokumen Laporan Pertanggungjawaban Bendahara Pengeluaran (SPJ Belanja Fungsional)...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "red", fontFamily: "sans-serif" }}>
        {error || "Data Rekapitulasi Belanja tidak ditemukan"}
      </div>
    );
  }

  const {
    upt,
    penandatanganKpa,
    penandatanganBendahara,
    rows = [],
    summary = {},
  } = data;

  const pageSizeStyle = paperSize === "A4" ? "297mm 210mm" : "330mm 215mm";
  const sheetWidth = paperSize === "A4" ? "297mm" : "330mm";
  const sheetMinHeight = paperSize === "A4" ? "210mm" : "215mm";

  const namaKpa = penandatanganKpa?.nama || "dr. SRI KHAIRUNNISA, MH, MKM";
  const nipKpa = penandatanganKpa?.nip || "197112262002122008";
  const jabatanKpa = penandatanganKpa?.jabatan || "Pengguna/Kuasa Pengguna Anggaran";
  const pangkatKpa = penandatanganKpa?.pangkat_golongan || "PEMBINA UTAMA MUDA/ IV.c";

  const namaBendahara = penandatanganBendahara?.nama || "SANLY MELISKA, S.K.M.";
  const nipBendahara = penandatanganBendahara?.nip || "198608262006042001";
  const jabatanBendahara = penandatanganBendahara?.jabatan || "Bendahara Pengeluaran";
  const pangkatBendahara = penandatanganBendahara?.pangkat_golongan || "PENATA MUDA TK. 1";

  const lastDay = getLastDayOfMonth(tahunNum, bulanNum);
  const tglTtdStr = `Sipirok, ${String(lastDay).padStart(2, "0")} ${BULAN_NAMA[bulanNum]} ${tahun}`;

  return (
    <div className="cetak-page-container">
      <style jsx global>{`
        @page {
          size: ${pageSizeStyle} landscape;
          margin: 8mm 12mm;
        }

        @media screen {
          .cetak-page-container {
            background-color: #f1f5f9;
            min-height: 100vh;
            padding: 24px 16px 60px;
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .cetak-sheet {
            background: white;
            width: ${sheetWidth};
            min-height: ${sheetMinHeight};
            max-width: 100%;
            padding: 12mm 15mm;
            border-radius: 4px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            box-sizing: border-box;
          }
        }

        @media print {
          html, body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .no-print,
          aside,
          header,
          nav {
            display: none !important;
          }

          .cetak-page-container {
            padding: 0 !important;
            background: white !important;
          }

          .cetak-sheet {
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: auto !important;
          }
        }

        .rekap-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 8px;
          margin-bottom: 16px;
          font-size: 8.5px;
          border: 1px solid #000;
        }

        .rekap-table th, .rekap-table td {
          border: 1px solid #000;
          padding: 3px 4px;
        }

        .rekap-table th {
          font-weight: bold;
          text-align: center;
          background-color: #fff;
        }
      `}</style>

      {/* Floating Action Pill Toolbar (Screen only) */}
      <div
        className="no-print"
        style={{
          position: "sticky",
          top: "16px",
          zIndex: 50,
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(8px)",
          padding: "8px 16px",
          borderRadius: "9999px",
          boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
          border: "1px solid #E2E8F0",
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 16px",
            fontSize: "13px",
            fontWeight: 500,
            color: "#475569",
            backgroundColor: "#F1F5F9",
            border: "1px solid #CBD5E1",
            borderRadius: "9999px",
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={15} /> Tutup
        </button>

        {/* Paper Size Selector */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            backgroundColor: "#F8FAFC",
            padding: "4px 8px",
            borderRadius: "9999px",
            border: "1px solid #E2E8F0",
          }}
        >
          <FileText size={15} style={{ color: "#64748B", marginLeft: "4px" }} />
          <span style={{ fontSize: "13px", fontWeight: 500, color: "#475569" }}>Kertas:</span>
          <button
            onClick={() => setPaperSize("Folio")}
            style={{
              padding: "4px 10px",
              fontSize: "12px",
              fontWeight: paperSize === "Folio" ? 600 : 400,
              backgroundColor: paperSize === "Folio" ? "#FFFFFF" : "transparent",
              color: paperSize === "Folio" ? "#0F172A" : "#64748B",
              border: paperSize === "Folio" ? "1px solid #CBD5E1" : "none",
              borderRadius: "9999px",
              cursor: "pointer",
            }}
          >
            Folio / F4
          </button>
          <button
            onClick={() => setPaperSize("A4")}
            style={{
              padding: "4px 10px",
              fontSize: "12px",
              fontWeight: paperSize === "A4" ? 600 : 400,
              backgroundColor: paperSize === "A4" ? "#FFFFFF" : "transparent",
              color: paperSize === "A4" ? "#0F172A" : "#64748B",
              border: paperSize === "A4" ? "1px solid #CBD5E1" : "none",
              borderRadius: "9999px",
              cursor: "pointer",
            }}
          >
            A4
          </button>
        </div>

        <button
          onClick={() => window.print()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 18px",
            fontSize: "13px",
            fontWeight: 600,
            color: "#FFFFFF",
            backgroundColor: "#059669",
            border: "none",
            borderRadius: "9999px",
            cursor: "pointer",
            boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
          }}
        >
          <Printer size={15} /> Cetak Sekarang
        </button>
      </div>

      {/* Sheet Halaman Cetak */}
      <div className="cetak-sheet text-black font-sans">
        {/* Header Format Resmi Sesuai Gambar */}
        <div className="text-center mb-3">
          <h2 className="text-[12px] font-bold uppercase tracking-wider">
            PEMERINTAH KABUPATEN TAPANULI SELATAN
          </h2>
          <h1 className="text-[13px] font-extrabold uppercase tracking-wide">
            LAPORAN PERTANGGUNGJAWABAN BENDAHARA PENGELUARAN
          </h1>
          <h3 className="text-[11px] font-bold uppercase tracking-wide">
            (SPJ BELANJA FUNGSIONAL)
          </h3>
        </div>

        {/* Metadata Header Kiri */}
        <div className="text-[9.5px] leading-tight mb-3 font-normal max-w-2xl">
          <table className="border-none w-full">
            <tbody>
              <tr>
                <td className="w-56 py-0.5 font-bold">SKPD/UPT</td>
                <td className="w-4 py-0.5">:</td>
                <td className="py-0.5 font-semibold">{kd_upt} - {upt?.nm_upt || "Puskesmas Batang Toru"}</td>
              </tr>
              <tr>
                <td className="py-0.5 font-bold">Pengguna/Kuasa Pengguna Anggaran</td>
                <td className="py-0.5">:</td>
                <td className="py-0.5 font-semibold">{namaKpa}</td>
              </tr>
              <tr>
                <td className="py-0.5 font-bold">Bendahara Pengeluaran</td>
                <td className="py-0.5">:</td>
                <td className="py-0.5 font-semibold">{namaBendahara}</td>
              </tr>
              <tr>
                <td className="py-0.5 font-bold">Tahun Anggaran</td>
                <td className="py-0.5">:</td>
                <td className="py-0.5 font-semibold">{tahun}</td>
              </tr>
              <tr>
                <td className="py-0.5 font-bold">Bulan</td>
                <td className="py-0.5">:</td>
                <td className="py-0.5 font-semibold uppercase">{BULAN_NAMA[bulanNum]}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Tabel Rekapitulasi SPJ Belanja Bertingkat Format Resmi */}
        <table className="w-full text-[8.5px] border-collapse border border-black font-sans">
          <thead>
            <tr className="text-center font-bold">
              <th rowSpan={2} className="border border-black p-1 w-[120px]">KODE<br />REKENING</th>
              <th rowSpan={2} className="border border-black p-1 min-w-[200px]">URAIAN</th>
              <th rowSpan={2} className="border border-black p-1 w-[80px]">JUMLAH<br />ANGGARAN<br />(Rp)</th>
              <th colSpan={3} className="border border-black p-1">APBD</th>
              <th colSpan={3} className="border border-black p-1">BLUD</th>
              <th colSpan={3} className="border border-black p-1">BOK</th>
              <th colSpan={3} className="border border-black p-1">JKN</th>
              <th rowSpan={2} className="border border-black p-1 w-[80px]">
                TOTAL SPJ<br />(APBD + BLUD + BOK + JKN)<br />(Rp)
              </th>
              <th rowSpan={2} className="border border-black p-1 w-[80px]">SISA ANGGARAN<br />(Rp)</th>
            </tr>
            <tr className="text-center font-bold text-[8px]">
              {/* APBD */}
              <th className="border border-black p-0.5 w-[58px]">S/D. BULAN LALU</th>
              <th className="border border-black p-0.5 w-[58px]">BULAN INI</th>
              <th className="border border-black p-0.5 w-[58px]">S/D. BULAN INI</th>
              {/* BLUD */}
              <th className="border border-black p-0.5 w-[58px]">S/D. BULAN LALU</th>
              <th className="border border-black p-0.5 w-[58px]">BULAN INI</th>
              <th className="border border-black p-0.5 w-[58px]">S/D. BULAN INI</th>
              {/* BOK */}
              <th className="border border-black p-0.5 w-[58px]">S/D. BULAN LALU</th>
              <th className="border border-black p-0.5 w-[58px]">BULAN INI</th>
              <th className="border border-black p-0.5 w-[58px]">S/D. BULAN INI</th>
              {/* JKN */}
              <th className="border border-black p-0.5 w-[58px]">S/D. BULAN LALU</th>
              <th className="border border-black p-0.5 w-[58px]">BULAN INI</th>
              <th className="border border-black p-0.5 w-[58px]">S/D. BULAN INI</th>
            </tr>
            <tr className="text-center text-[7.5px] italic">
              <td className="border border-black p-0.5">1</td>
              <td className="border border-black p-0.5">2</td>
              <td className="border border-black p-0.5">3</td>
              <td className="border border-black p-0.5">4</td>
              <td className="border border-black p-0.5">5</td>
              <td className="border border-black p-0.5">6</td>
              <td className="border border-black p-0.5">7</td>
              <td className="border border-black p-0.5">8</td>
              <td className="border border-black p-0.5">9</td>
              <td className="border border-black p-0.5">10</td>
              <td className="border border-black p-0.5">11</td>
              <td className="border border-black p-0.5">12</td>
              <td className="border border-black p-0.5">13</td>
              <td className="border border-black p-0.5">14</td>
              <td className="border border-black p-0.5">15</td>
              <td className="border border-black p-0.5">16 = 6+9+12+15</td>
              <td className="border border-black p-0.5">17 = 3-16</td>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={17} className="border border-black p-4 text-center">
                  Tidak ada data realisasi/anggaran pada periode ini.
                </td>
              </tr>
            ) : (
              rows.map((row: any) => {
                const isProg = row.level === "program";
                const isGiat = row.level === "kegiatan";
                const isSub = row.level === "sub_kegiatan";

                let fontWeight = isProg || isGiat || isSub ? "bold" : "normal";

                return (
                  <tr
                    key={row.id}
                    style={{
                      fontWeight,
                      pageBreakInside: "avoid",
                    }}
                  >
                    <td className="border border-black p-1 text-left align-top">{row.kode}</td>
                    <td className="border border-black p-1 text-left align-top">
                      {row.uraian}
                    </td>
                    <td className="border border-black p-1 text-right align-top">
                      {formatCurrencyRupiah(row.jumlahAnggaran)}
                    </td>
                    {/* APBD */}
                    <td className="border border-black p-1 text-right align-top">{formatCurrencyRupiah(row.apbdLalu)}</td>
                    <td className="border border-black p-1 text-right align-top">{formatCurrencyRupiah(row.apbdIni)}</td>
                    <td className="border border-black p-1 text-right align-top">{formatCurrencyRupiah(row.apbdSdIni)}</td>
                    {/* BLUD */}
                    <td className="border border-black p-1 text-right align-top">{formatCurrencyRupiah(row.bludLalu)}</td>
                    <td className="border border-black p-1 text-right align-top">{formatCurrencyRupiah(row.bludIni)}</td>
                    <td className="border border-black p-1 text-right align-top">{formatCurrencyRupiah(row.bludSdIni)}</td>
                    {/* BOK */}
                    <td className="border border-black p-1 text-right align-top">{formatCurrencyRupiah(row.bokLalu)}</td>
                    <td className="border border-black p-1 text-right align-top">{formatCurrencyRupiah(row.bokIni)}</td>
                    <td className="border border-black p-1 text-right align-top">{formatCurrencyRupiah(row.bokSdIni)}</td>
                    {/* JKN */}
                    <td className="border border-black p-1 text-right align-top">{formatCurrencyRupiah(row.jknLalu)}</td>
                    <td className="border border-black p-1 text-right align-top">{formatCurrencyRupiah(row.jknIni)}</td>
                    <td className="border border-black p-1 text-right align-top">{formatCurrencyRupiah(row.jknSdIni)}</td>
                    {/* TOTAL & SISA */}
                    <td className="border border-black p-1 text-right align-top">{formatCurrencyRupiah(row.totalSpj)}</td>
                    <td className="border border-black p-1 text-right align-top">{formatCurrencyRupiah(row.sisaAnggaran)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot>
            <tr className="font-bold text-center">
              <td colSpan={2} className="border border-black p-1">
                TOTAL
              </td>
              <td className="border border-black p-1 text-right">
                {formatCurrencyRupiah(summary.grandAnggaran)}
              </td>
              {/* APBD */}
              <td className="border border-black p-1 text-right">{formatCurrencyRupiah(summary.grandApbdLalu)}</td>
              <td className="border border-black p-1 text-right">{formatCurrencyRupiah(summary.grandApbdIni)}</td>
              <td className="border border-black p-1 text-right">{formatCurrencyRupiah(summary.grandApbdSdIni)}</td>
              {/* BLUD */}
              <td className="border border-black p-1 text-right">{formatCurrencyRupiah(summary.grandBludLalu)}</td>
              <td className="border border-black p-1 text-right">{formatCurrencyRupiah(summary.grandBludIni)}</td>
              <td className="border border-black p-1 text-right">{formatCurrencyRupiah(summary.grandBludSdIni)}</td>
              {/* BOK */}
              <td className="border border-black p-1 text-right">{formatCurrencyRupiah(summary.grandBokLalu)}</td>
              <td className="border border-black p-1 text-right">{formatCurrencyRupiah(summary.grandBokIni)}</td>
              <td className="border border-black p-1 text-right">{formatCurrencyRupiah(summary.grandBokSdIni)}</td>
              {/* JKN */}
              <td className="border border-black p-1 text-right">{formatCurrencyRupiah(summary.grandJknLalu)}</td>
              <td className="border border-black p-1 text-right">{formatCurrencyRupiah(summary.grandJknIni)}</td>
              <td className="border border-black p-1 text-right">{formatCurrencyRupiah(summary.grandJknSdIni)}</td>
              {/* TOTAL & SISA */}
              <td className="border border-black p-1 text-right">{formatCurrencyRupiah(summary.grandTotalSpj)}</td>
              <td className="border border-black p-1 text-right">{formatCurrencyRupiah(summary.grandSisaAnggaran)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Tanda Tangan Cetak */}
        <div className="mt-8 grid grid-cols-2 text-center text-[10px] break-inside-avoid">
          <div>
            <p>Mengetahui,</p>
            <p className="font-bold">{jabatanKpa}</p>
            <div className="h-16" />
            <p className="font-bold underline">{namaKpa}</p>
            <p>{pangkatKpa}</p>
            <p>NIP. {nipKpa}</p>
          </div>

          <div>
            <p>{tglTtdStr}</p>
            <p className="font-bold">{jabatanBendahara}</p>
            <div className="h-16" />
            <p className="font-bold underline">{namaBendahara}</p>
            <p>{pangkatBendahara}</p>
            <p>NIP. {nipBendahara}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CetakRekapBelanjaPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Menyiapkan halaman cetak...</div>}>
      <CetakRekapBelanjaContent />
    </Suspense>
  );
}
