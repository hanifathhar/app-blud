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
          onClick={() => window.close()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 16px",
            fontSize: "14px",
            fontWeight: 500,
            color: "#475569",
            backgroundColor: "#F1F5F9",
            border: "1px solid #CBD5E1",
            borderRadius: "9999px",
            cursor: "pointer",
          }}
        >
          <ArrowLeft size={16} /> Tutup
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
        {/* Header Title */}
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "13px", fontWeight: "bold", margin: "0 0 2px 0", letterSpacing: "0.5px" }}>
            PEMERINTAH KABUPATEN TAPANULI SELATAN
          </h2>
          <h1 style={{ fontSize: "14px", fontWeight: "bold", margin: "0 0 2px 0", letterSpacing: "0.5px" }}>
            LAPORAN PERTANGGUNGJAWABAN BENDAHARA PENGELUARAN
          </h1>
          <h3 style={{ fontSize: "13px", fontWeight: "bold", margin: "0", letterSpacing: "0.5px" }}>
            (SPJ BELANJA FUNGSIONAL)
          </h3>
        </div>

        {/* Metadata Information List (Exact like BKU Rincian Objek) */}
        <div style={{ width: "100%", marginBottom: "12px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
            <tbody>
              <tr>
                <td style={{ width: "240px", padding: "1.5px 0", verticalAlign: "top" }}>Unit/UPT</td>
                <td style={{ width: "15px", padding: "1.5px 0", verticalAlign: "top" }}>:</td>
                <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>
                  {data.upt?.kd_upt ? `${data.upt?.kd_upt} - ${data.upt?.nm_upt}` : `${kd_upt} - Puskesmas Batang Toru`}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>Pengguna/Kuasa Pengguna Anggaran</td>
                <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>:</td>
                <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>{namaKpa}</td>
              </tr>
              <tr>
                <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>Bendahara Pengeluaran</td>
                <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>:</td>
                <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>{namaBendahara}</td>
              </tr>
              <tr>
                <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>Tahun Anggaran</td>
                <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>:</td>
                <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>{tahun}</td>
              </tr>
              <tr>
                <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>Bulan</td>
                <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>:</td>
                <td style={{ padding: "1.5px 0", verticalAlign: "top", textTransform: "uppercase" }}>{BULAN_NAMA[bulanNum]}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Tabel Rekapitulasi SPJ Belanja Bertingkat Format Resmi */}
        <table className="w-full text-[8.5px] border-collapse border border-black font-sans leading-tight">
          <thead>
            <tr className="text-center font-bold bg-white">
              <th rowSpan={2} className="border border-black p-1 w-[110px]">KODE<br />REKENING</th>
              <th rowSpan={2} className="border border-black p-1 min-w-[200px]">URAIAN</th>
              <th rowSpan={2} className="border border-black p-1 w-[75px]">JUMLAH<br />ANGGARAN<br />(Rp)</th>
              <th colSpan={3} className="border border-black p-1">APBD</th>
              <th colSpan={3} className="border border-black p-1">BLUD</th>
              <th colSpan={3} className="border border-black p-1">BOK</th>
              <th colSpan={3} className="border border-black p-1">JKN</th>
              <th rowSpan={2} className="border border-black p-1 w-[78px]">
                TOTAL SPJ<br />(APBD+BLUD+<br />BOK+JKN) (Rp)
              </th>
              <th rowSpan={2} className="border border-black p-1 w-[75px]">SISA ANGGARAN<br />(Rp)</th>
            </tr>
            <tr className="text-center font-bold text-[7.5px] bg-white">
              {/* APBD */}
              <th className="border border-black p-0.5 w-[52px]">S/D. BULAN LALU</th>
              <th className="border border-black p-0.5 w-[52px]">BULAN INI</th>
              <th className="border border-black p-0.5 w-[52px]">S/D. BULAN INI</th>
              {/* BLUD */}
              <th className="border border-black p-0.5 w-[52px]">S/D. BULAN LALU</th>
              <th className="border border-black p-0.5 w-[52px]">BULAN INI</th>
              <th className="border border-black p-0.5 w-[52px]">S/D. BULAN INI</th>
              {/* BOK */}
              <th className="border border-black p-0.5 w-[52px]">S/D. BULAN LALU</th>
              <th className="border border-black p-0.5 w-[52px]">BULAN INI</th>
              <th className="border border-black p-0.5 w-[52px]">S/D. BULAN INI</th>
              {/* JKN */}
              <th className="border border-black p-0.5 w-[52px]">S/D. BULAN LALU</th>
              <th className="border border-black p-0.5 w-[52px]">BULAN INI</th>
              <th className="border border-black p-0.5 w-[52px]">S/D. BULAN INI</th>
            </tr>
            <tr className="text-center text-[7px] italic bg-white">
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
                    <td className="border border-black px-1.5 py-1 text-left align-top">{row.kode}</td>
                    <td className="border border-black px-1.5 py-1 text-left align-top">
                      {row.uraian}
                    </td>
                    <td className="border border-black px-1.5 py-1 text-right align-top">
                      {formatCurrencyRupiah(row.jumlahAnggaran)}
                    </td>
                    {/* APBD */}
                    <td className="border border-black px-1 py-1 text-right align-top">{formatCurrencyRupiah(row.apbdLalu)}</td>
                    <td className="border border-black px-1 py-1 text-right align-top">{formatCurrencyRupiah(row.apbdIni)}</td>
                    <td className="border border-black px-1 py-1 text-right align-top">{formatCurrencyRupiah(row.apbdSdIni)}</td>
                    {/* BLUD */}
                    <td className="border border-black px-1 py-1 text-right align-top">{formatCurrencyRupiah(row.bludLalu)}</td>
                    <td className="border border-black px-1 py-1 text-right align-top">{formatCurrencyRupiah(row.bludIni)}</td>
                    <td className="border border-black px-1 py-1 text-right align-top">{formatCurrencyRupiah(row.bludSdIni)}</td>
                    {/* BOK */}
                    <td className="border border-black px-1 py-1 text-right align-top">{formatCurrencyRupiah(row.bokLalu)}</td>
                    <td className="border border-black px-1 py-1 text-right align-top">{formatCurrencyRupiah(row.bokIni)}</td>
                    <td className="border border-black px-1 py-1 text-right align-top">{formatCurrencyRupiah(row.bokSdIni)}</td>
                    {/* JKN */}
                    <td className="border border-black px-1 py-1 text-right align-top">{formatCurrencyRupiah(row.jknLalu)}</td>
                    <td className="border border-black px-1 py-1 text-right align-top">{formatCurrencyRupiah(row.jknIni)}</td>
                    <td className="border border-black px-1 py-1 text-right align-top">{formatCurrencyRupiah(row.jknSdIni)}</td>
                    {/* TOTAL & SISA */}
                    <td className="border border-black px-1.5 py-1 text-right align-top">{formatCurrencyRupiah(row.totalSpj)}</td>
                    <td className="border border-black px-1.5 py-1 text-right align-top">{formatCurrencyRupiah(row.sisaAnggaran)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot>
            <tr className="font-bold text-center bg-white">
              <td colSpan={2} className="border border-black px-2 py-1.5">
                TOTAL
              </td>
              <td className="border border-black px-1.5 py-1.5 text-right">
                {formatCurrencyRupiah(summary.grandAnggaran)}
              </td>
              {/* APBD */}
              <td className="border border-black px-1 py-1.5 text-right">{formatCurrencyRupiah(summary.grandApbdLalu)}</td>
              <td className="border border-black px-1 py-1.5 text-right">{formatCurrencyRupiah(summary.grandApbdIni)}</td>
              <td className="border border-black px-1 py-1.5 text-right">{formatCurrencyRupiah(summary.grandApbdSdIni)}</td>
              {/* BLUD */}
              <td className="border border-black px-1 py-1.5 text-right">{formatCurrencyRupiah(summary.grandBludLalu)}</td>
              <td className="border border-black px-1 py-1.5 text-right">{formatCurrencyRupiah(summary.grandBludIni)}</td>
              <td className="border border-black px-1 py-1.5 text-right">{formatCurrencyRupiah(summary.grandBludSdIni)}</td>
              {/* BOK */}
              <td className="border border-black px-1 py-1.5 text-right">{formatCurrencyRupiah(summary.grandBokLalu)}</td>
              <td className="border border-black px-1 py-1.5 text-right">{formatCurrencyRupiah(summary.grandBokIni)}</td>
              <td className="border border-black px-1 py-1.5 text-right">{formatCurrencyRupiah(summary.grandBokSdIni)}</td>
              {/* JKN */}
              <td className="border border-black px-1 py-1.5 text-right">{formatCurrencyRupiah(summary.grandJknLalu)}</td>
              <td className="border border-black px-1 py-1.5 text-right">{formatCurrencyRupiah(summary.grandJknIni)}</td>
              <td className="border border-black px-1 py-1.5 text-right">{formatCurrencyRupiah(summary.grandJknSdIni)}</td>
              {/* TOTAL & SISA */}
              <td className="border border-black px-1.5 py-1.5 text-right">{formatCurrencyRupiah(summary.grandTotalSpj)}</td>
              <td className="border border-black px-1.5 py-1.5 text-right">{formatCurrencyRupiah(summary.grandSisaAnggaran)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Signature Area (Exact like BKU Rincian Objek & BKU Pajak) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            marginTop: "30px",
            fontSize: "11px",
            pageBreakInside: "avoid",
          }}
        >
          {/* Mengetahui KPA */}
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: "0 0 3px 0" }}>Mengetahui,</p>
            <p style={{ fontWeight: "bold", textTransform: "uppercase", margin: 0 }}>
              {jabatanKpa}
            </p>
            <div style={{ height: "65px" }} />
            <p style={{ fontWeight: "bold", textDecoration: "underline", margin: "0 0 2px 0" }}>
              {namaKpa}
            </p>
            <p style={{ margin: "0 0 2px 0" }}>{pangkatKpa}</p>
            <p style={{ margin: 0 }}>NIP. {nipKpa}</p>
          </div>

          {/* Bendahara Pengeluaran */}
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: "0 0 3px 0" }}>{tglTtdStr}</p>
            <p style={{ fontWeight: "bold", textTransform: "uppercase", margin: 0 }}>
              {jabatanBendahara}
            </p>
            <div style={{ height: "65px" }} />
            <p style={{ fontWeight: "bold", textDecoration: "underline", margin: "0 0 2px 0" }}>
              {namaBendahara}
            </p>
            <p style={{ margin: "0 0 2px 0" }}>{pangkatBendahara}</p>
            <p style={{ margin: 0 }}>NIP. {nipBendahara}</p>
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
