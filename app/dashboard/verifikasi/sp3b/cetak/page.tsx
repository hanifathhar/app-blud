"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Printer, FileText, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

function formatCurrencyRupiah(val: number) {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(val || 0);
}

const BULAN_NAMA = [
  "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

function CetakSp3bContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paperSize, setPaperSize] = useState<"A4" | "Folio">("Folio");
  const [zoom, setZoom] = useState<number>(100);

  const no_sp3b = searchParams.get("no_sp3b") || "";
  const kd_upt = searchParams.get("kd_upt") || "";

  const handleKembali = () => {
    if (typeof window !== "undefined") {
      if (window.opener) {
        window.close();
      } else if (window.history.length > 1) {
        window.history.back();
      } else {
        router.push("/dashboard/verifikasi/sp3b");
      }
    }
  };

  useEffect(() => {
    const fetchSp3bDetail = async () => {
      if (!no_sp3b || !kd_upt) {
        setError("Parameter 'no_sp3b' atau 'kd_upt' tidak ditemukan pada URL.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const res = await fetch(
          `/api/verifikasi/sp3b/detail?no_sp3b=${encodeURIComponent(no_sp3b)}&kd_upt=${encodeURIComponent(kd_upt)}`
        );

        const result = await res.json();

        if (res.ok && result.success) {
          setData(result.data);
        } else {
          setError(result.message || "Gagal mengambil data SP3B dari server");
        }
      } catch (err: any) {
        console.error("Gagal mengambil detail SP3B:", err);
        setError("Terjadi kesalahan jaringan atau server saat mengambil data");
      } finally {
        setLoading(false);
      }
    };

    fetchSp3bDetail();
  }, [no_sp3b, kd_upt]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 text-slate-600 font-sans">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-semibold text-sm">Menyiapkan pratinjau dokumen SP3B resmi...</p>
        <span className="text-xs text-slate-400 mt-1">Mengambil data rincian dan otorisasi penandatangan</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans">
        <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full text-center border border-red-200">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-xl">!</div>
          <p className="text-red-600 font-semibold text-sm mb-4">{error || "Data SP3B tidak ditemukan"}</p>
          <button
            onClick={handleKembali}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-700 transition-colors shadow cursor-pointer"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  const {
    nm_upt = "",
    tgl_sp3b,
    bulan = 1,
    tahun,
    sumdan = "BOK",
    total_pendapatan = 0,
    total_belanja = 0,
    saldo_awal = 0,
    saldo_akhir,
    rincianPendapatan = [],
    rincianBelanja = [],
    upt,
    nm_kadis = "",
    nip_kadis = "",
    pangkat_kadis = "",
    jabatan_kadis = "",
    penandatanganKadis = null,
    kd_program = "",
    kd_kegiatan = "",
    kd_sub_kegiatan_utama = "",
  } = data;

  const pageSizeStyle = paperSize === "A4" ? "210mm 297mm" : "215mm 330mm";
  const sheetWidth = paperSize === "A4" ? "210mm" : "215mm";
  const sheetMinHeight = paperSize === "A4" ? "297mm" : "330mm";

  const tglCetak = tgl_sp3b ? new Date(tgl_sp3b) : new Date();
  const tahunAnggaran = tahun || tglCetak.getFullYear();
  const tglFormatted = tglCetak.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }).toUpperCase();

  const totalPend = Number(total_pendapatan) || 0;
  const totalBel = Number(total_belanja) || 0;
  const saldoAwal = Number(saldo_awal) || 0;
  const saldoAkhir = saldo_akhir != null ? Number(saldo_akhir) : (saldoAwal + totalPend - totalBel);

  const firstBelanja = rincianBelanja[0];
  const kdSubKegiatan = kd_sub_kegiatan_utama || firstBelanja?.kd_sub_kegiatan || "1.01.02.1.01.02.01";
  const kdProgram = kd_program || "1.01.02";
  const kdKegiatan = kd_kegiatan || "1.01.02.1.01";

  // Minimum 5 baris agar format tabel portrait tetap tegak, kokoh, dan proporsional
  const minRows = 5;
  const maxRows = Math.max(rincianPendapatan.length, rincianBelanja.length, minRows);
  const paddedPend: any[] = [...rincianPendapatan, ...Array(Math.max(0, maxRows - rincianPendapatan.length)).fill(null)];
  const paddedBel: any[] = [...rincianBelanja, ...Array(Math.max(0, maxRows - rincianBelanja.length)).fill(null)];

  const namaPenandatangan = penandatanganKadis?.nama || nm_kadis || data?.nm_kadis || "";
  const nipPenandatangan = penandatanganKadis?.nip || nip_kadis || data?.nip_kadis || "";
  const pangkatPenandatangan = penandatanganKadis?.pangkat_golongan || pangkat_kadis || "";
  const jabatanPenandatangan = penandatanganKadis?.jabatan?.toUpperCase() || jabatan_kadis || "KEPALA DINAS KESEHATAN DAERAH";

  return (
    <div className="cetak-page-container">
      {/* GLOBAL CSS UNTUK PRINT & SCREEN */}
      <style jsx global>{`
        @page {
          size: ${pageSizeStyle} portrait;
          margin: 10mm 12mm;
        }

        @media screen {
          .cetak-page-container {
            min-height: 100vh;
            background-color: #cbd5e1;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            padding-bottom: 80px;
          }

          .print-canvas {
            padding: 30px 16px;
            display: flex;
            justify-content: center;
            overflow-x: auto;
          }

          .print-sheet {
            background-color: #ffffff;
            width: ${sheetWidth};
            min-height: ${sheetMinHeight};
            padding: 10mm 12mm;
            border-radius: 3px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0,0,0,0.06);
            box-sizing: border-box;
            transition: transform 0.15s ease-out;
          }
        }

        @media print {
          html, body {
            background: transparent !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .no-print {
            display: none !important;
          }

          .cetak-page-container {
            background: transparent !important;
            padding: 0 !important;
            min-height: auto !important;
          }

          .print-canvas {
            padding: 0 !important;
            display: block !important;
          }

          .print-sheet {
            width: 100% !important;
            min-height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            transform: none !important;
          }
        }

        .document-frame {
          border: 2px solid #000;
          font-family: "Bookman Old Style", "Times New Roman", Times, Georgia, serif;
          font-size: 10.5pt;
          line-height: 1.35;
          color: #000;
          background: #fff;
          box-sizing: border-box;
          width: 100%;
        }

        .sp3b-table {
          width: 100%;
          border-collapse: collapse;
        }

        .sp3b-table td, .sp3b-table th {
          border: 1px solid #000;
          padding: 5px 6px;
          vertical-align: middle;
        }

        .border-b-thick {
          border-bottom: 2px solid #000;
        }

        .border-b-mid {
          border-bottom: 1.5px solid #000;
        }

        .btn-toolbar-kembali:hover {
          background-color: #334155 !important;
          color: #ffffff !important;
        }

        .btn-toolbar-icon:hover {
          background-color: #334155 !important;
          color: #ffffff !important;
        }

        .btn-cetak-sp3b:hover {
          background-image: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%) !important;
          box-shadow: 0 6px 20px rgba(37, 99, 235, 0.6) !important;
          transform: translateY(-1px);
        }

        .btn-cetak-sp3b:active {
          transform: translateY(1px);
          box-shadow: 0 2px 8px rgba(37, 99, 235, 0.4) !important;
        }

        .btn-cetak-sp3b-fab:hover {
          background-image: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%) !important;
          box-shadow: 0 12px 30px rgba(30, 58, 138, 0.6) !important;
          transform: scale(1.04);
        }

        .btn-cetak-sp3b-fab:active {
          transform: scale(0.96);
        }
      `}</style>

      {/* 1. TOP EXECUTIVE TOOLBAR (HANYA LAYAR) */}
      <header
        className="no-print"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          backgroundColor: "#0F172A",
          borderBottom: "1px solid #1E293B",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3)",
          width: "100%",
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "10px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            boxSizing: "border-box",
            flexWrap: "wrap",
          }}
        >
          {/* Sisi Kiri: Tombol Kembali & Info Dokumen */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
            <button
              onClick={handleKembali}
              className="btn-toolbar-kembali"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "7px 14px",
                backgroundColor: "#1E293B",
                color: "#E2E8F0",
                border: "1px solid #334155",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              title="Kembali ke halaman sebelumnya"
            >
              <ArrowLeft size={16} />
              <span>Kembali</span>
            </button>

            <div style={{ width: "1px", height: "24px", backgroundColor: "#334155" }} />

            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  backgroundColor: "rgba(37, 99, 235, 0.15)",
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <FileText size={16} color="#60A5FA" />
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#94A3B8",
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                  }}
                >
                  Pratinjau SP3B
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#93C5FD",
                    fontFamily: "monospace",
                    letterSpacing: "0.2px",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "280px",
                  }}
                >
                  {no_sp3b}
                </div>
              </div>
            </div>
          </div>

          {/* Sisi Kanan: Pengatur Kertas, Zoom, & Tombol Cetak */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
            {/* Zoom Controls */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                backgroundColor: "#1E293B",
                border: "1px solid #334155",
                borderRadius: "8px",
                padding: "3px 6px",
                gap: "2px",
              }}
            >
              <button
                onClick={() => setZoom((z) => Math.max(60, z - 10))}
                className="btn-toolbar-icon"
                style={{
                  padding: "5px 7px",
                  backgroundColor: "transparent",
                  border: "none",
                  color: "#CBD5E1",
                  borderRadius: "6px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title="Perkecil (-10%)"
              >
                <ZoomOut size={14} />
              </button>
              <span
                style={{
                  fontSize: "12px",
                  fontFamily: "monospace",
                  fontWeight: 600,
                  color: "#F1F5F9",
                  minWidth: "44px",
                  textAlign: "center",
                  userSelect: "none",
                }}
              >
                {zoom}%
              </span>
              <button
                onClick={() => setZoom((z) => Math.min(130, z + 10))}
                className="btn-toolbar-icon"
                style={{
                  padding: "5px 7px",
                  backgroundColor: "transparent",
                  border: "none",
                  color: "#CBD5E1",
                  borderRadius: "6px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title="Perbesar (+10%)"
              >
                <ZoomIn size={14} />
              </button>
              <div style={{ width: "1px", height: "16px", backgroundColor: "#334155", margin: "0 2px" }} />
              <button
                onClick={() => setZoom(100)}
                className="btn-toolbar-icon"
                style={{
                  padding: "5px 7px",
                  backgroundColor: "transparent",
                  border: "none",
                  color: "#94A3B8",
                  borderRadius: "6px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                title="Reset Ukuran (100%)"
              >
                <RotateCcw size={13} />
              </button>
            </div>

            {/* Pilihan Ukuran Kertas */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                backgroundColor: "#1E293B",
                border: "1px solid #334155",
                borderRadius: "8px",
                padding: "3px",
                gap: "3px",
              }}
            >
              <span style={{ fontSize: "11px", fontWeight: 600, color: "#94A3B8", padding: "0 6px" }}>
                Kertas:
              </span>
              <button
                onClick={() => setPaperSize("Folio")}
                style={{
                  padding: "5px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: paperSize === "Folio" ? "#FFFFFF" : "#CBD5E1",
                  backgroundColor: paperSize === "Folio" ? "#2563EB" : "transparent",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: paperSize === "Folio" ? "0 2px 6px rgba(37,99,235,0.4)" : "none",
                }}
              >
                Folio / F4
              </button>
              <button
                onClick={() => setPaperSize("A4")}
                style={{
                  padding: "5px 12px",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: paperSize === "A4" ? "#FFFFFF" : "#CBD5E1",
                  backgroundColor: paperSize === "A4" ? "#2563EB" : "transparent",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: paperSize === "A4" ? "0 2px 6px rgba(37,99,235,0.4)" : "none",
                }}
              >
                A4
              </button>
            </div>

            {/* Tombol Cetak Utama */}
            <button
              onClick={() => window.print()}
              className="btn-cetak-sp3b"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 18px",
                backgroundColor: "#2563EB",
                backgroundImage: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
                color: "#FFFFFF",
                fontSize: "13px",
                fontWeight: 700,
                borderRadius: "8px",
                border: "1px solid #60A5FA",
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(37, 99, 235, 0.45)",
                transition: "all 0.15s ease",
                letterSpacing: "0.2px",
              }}
              title="Cetak Dokumen SP3B (Ctrl+P)"
            >
              <Printer size={16} />
              <span>Cetak Dokumen</span>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  backgroundColor: "rgba(0, 0, 0, 0.25)",
                  color: "#DBEAFE",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  marginLeft: "2px",
                  fontFamily: "monospace",
                }}
              >
                Ctrl+P
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. DOCUMENT CANVAS CONTAINER */}
      <main className="print-canvas">
        <article
          className="print-sheet"
          style={{
            transform: zoom !== 100 ? `scale(${zoom / 100})` : "none",
            transformOrigin: "top center",
          }}
        >
          {/* BINGKAI UTAMA SP3B RESMI (DOCUMENT FRAME) */}
          <div className="document-frame">
            {/* BAGIAN 1: KOP SURAT RESMI */}
            <table className="sp3b-table border-b-thick" style={{ border: "none" }}>
              <tbody>
                <tr>
                  <td
                    style={{
                      width: "18%",
                      padding: "10px 8px",
                      textAlign: "center",
                      verticalAlign: "middle",
                      borderTop: "none",
                      borderLeft: "none",
                      borderBottom: "none",
                      borderRight: "2px solid #000",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/images/logo-tapsel.png"
                      alt="Logo Kabupaten Tapanuli Selatan"
                      style={{ width: 72, height: "auto", margin: "0 auto", display: "block" }}
                    />
                  </td>
                  <td
                    style={{
                      padding: "8px 12px 10px",
                      textAlign: "center",
                      verticalAlign: "middle",
                      borderTop: "none",
                      borderRight: "none",
                      borderBottom: "none",
                      borderLeft: "none",
                    }}
                  >
                    <div style={{ fontSize: "11.5pt", fontWeight: 700, letterSpacing: "0.4px", lineHeight: "1.25" }}>
                      PEMERINTAH KABUPATEN TAPANULI SELATAN
                    </div>
                    <div style={{ fontSize: "13pt", fontWeight: 800, marginTop: 2, letterSpacing: "0.5px", lineHeight: "1.25" }}>
                      DINAS KESEHATAN DAERAH
                    </div>
                    <div style={{ marginTop: 8, fontSize: "11pt", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.3px", lineHeight: "1.25" }}>
                      SURAT PERMINTAAN PENGESAHAN PENDAPATAN
                    </div>
                    <div style={{ marginTop: 8, fontSize: "11pt", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.3px", lineHeight: "1.25" }}>
                      DAN BELANJA (SP3B)
                    </div>
                    <div style={{ fontSize: "10pt", fontWeight: 700, marginTop: 4 }}>
                      TANGGAL : {tglFormatted}
                    </div>
                    <div style={{ fontSize: "10pt", fontWeight: 700, marginTop: 4 }}>
                      NOMOR : {no_sp3b}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            {/* BAGIAN 2: KALIMAT PENGANTAR */}
            <div className="border-b-mid" style={{ fontSize: "10.5pt", lineHeight: "1.4" }}>
              <div style={{ padding: "5px 10px", borderBottom: "1px solid #000" }}>
              </div>
              <div style={{ padding: "5px 10px", borderBottom: "1px solid #000" }}>
                Kepala Dinas Kesehatan Daerah Kabupaten Tapanuli Selatan memohon kepada :
              </div>
              <div style={{ padding: "5px 10px", fontWeight: 700, borderBottom: "1px solid #000" }}>
                Bendahara Umum Daerah Selaku PPKD
              </div>
              <div style={{ padding: "5px 10px" }}>
                Agar Mengesahkan dan membukukan pendapatan dan belanja dana {sumdan} sejumlah :
              </div>
            </div>

            {/* BAGIAN 3: RINGKASAN SALDO (4 POIN) */}
            <div className="border-b-mid" style={{ padding: "6px 12px 7px" }}>
              <table style={{ borderCollapse: "collapse", fontSize: "10.5pt", width: "auto" }}>
                <tbody>
                  {[
                    { label: "1. Saldo Awal", val: saldoAwal },
                    { label: "2. Pendapatan", val: totalPend },
                    { label: "3. Belanja", val: totalBel },
                    { label: "4. Saldo Akhir", val: saldoAkhir },
                  ].map(({ label, val }) => (
                    <tr key={label}>
                      <td style={{ padding: "1.5px 0", width: 120, fontWeight: 500 }}>{label}</td>
                      <td style={{ padding: "1.5px 6px 1.5px 0", textAlign: "center", width: 12 }}>:</td>
                      <td style={{ padding: "1.5px 4px 1.5px 0", width: 26, fontWeight: 600 }}>Rp.</td>
                      <td style={{ padding: "1.5px 0", textAlign: "right", minWidth: 125, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                        {formatCurrencyRupiah(val)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* BAGIAN 4: IDENTITAS PENGESAHAN & STRUKTUR BLUD */}
            <table className="sp3b-table border-b-mid" style={{ fontSize: "10pt" }}>
              <tbody>
                <tr>
                  <td style={{ width: "22%", textAlign: "center", borderLeft: "none", borderTop: "none", fontWeight: 600 }}>
                    Untuk Bulan
                  </td>
                  <td style={{ width: "28%", textAlign: "center", borderTop: "none", fontWeight: 700 }}>
                    {BULAN_NAMA[bulan]}
                  </td>
                  <td style={{ width: "25%", textAlign: "center", borderTop: "none", fontWeight: 600 }}>
                    Tahun Anggaran
                  </td>
                  <td style={{ width: "25%", textAlign: "center", borderRight: "none", borderTop: "none", fontWeight: 700 }}>
                    {tahunAnggaran}
                  </td>
                </tr>
                <tr>
                  <td style={{ textAlign: "center", borderLeft: "none", fontWeight: 600 }}>Dasar Pengesahan</td>
                  <td style={{ textAlign: "center", fontWeight: 600 }}>Urusan</td>
                  <td style={{ textAlign: "center", fontWeight: 600 }}>Organisasi</td>
                  <td style={{ textAlign: "center", borderRight: "none", fontWeight: 600 }}>Nama BLUD</td>
                </tr>
                <tr>
                  <td style={{ borderLeft: "none", textAlign: "center", verticalAlign: "top", padding: "6px 4px", fontWeight: 600 }}>
                    {kdKegiatan}
                  </td>
                  <td style={{ textAlign: "center", verticalAlign: "top", padding: "6px 4px" }}>
                    <div style={{ fontWeight: 600 }}>{kdProgram}</div>
                    <div style={{ marginTop: 2, fontSize: "9pt", color: "#334155" }}>Program :</div>
                    <div style={{ fontWeight: 600 }}>{kdSubKegiatan}</div>
                  </td>
                  <td style={{ textAlign: "center", verticalAlign: "top", padding: "6px 4px" }}>
                    <div style={{ fontWeight: 700 }}>Dinas Kesehatan Daerah</div>
                    <div style={{ marginTop: 2, fontSize: "9pt", color: "#334155" }}>Kegiatan :</div>
                    <div style={{ fontWeight: 600 }}>{kdKegiatan}.01.00</div>
                  </td>
                  <td style={{ borderRight: "none", textAlign: "center", verticalAlign: "top", padding: "6px 4px", fontWeight: 700 }}>
                    {nm_upt || upt?.nm_upt || "BLUD Puskesmas"}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* BAGIAN 5: TABEL RINCIAN PENDAPATAN & BELANJA */}
            <table className="sp3b-table border-b-thick" style={{ fontSize: "9.5pt" }}>
              <thead>
                {/* Header Grup Utama */}
                <tr>
                  <th colSpan={2} style={{ borderLeft: "none", borderTop: "none", width: "50%", padding: "6px 4px", textAlign: "center", fontWeight: 800, fontSize: "10.5pt", letterSpacing: "0.5px" }}>
                    PENDAPATAN
                  </th>
                  <th colSpan={2} style={{ borderRight: "none", borderTop: "none", width: "50%", padding: "6px 4px", textAlign: "center", fontWeight: 800, fontSize: "10.5pt", letterSpacing: "0.5px" }}>
                    BELANJA
                  </th>
                </tr>
                {/* Header Sub Kolom */}
                <tr>
                  <th style={{ borderLeft: "none", width: "24%", padding: "5px 4px", textAlign: "center", fontWeight: 700, fontSize: "9.5pt" }}>
                    KODE REKENING
                  </th>
                  <th style={{ width: "26%", padding: "5px 4px", textAlign: "center", fontWeight: 700, fontSize: "9.5pt" }}>
                    JUMLAH (RP)
                  </th>
                  <th style={{ width: "24%", padding: "5px 4px", textAlign: "center", fontWeight: 700, fontSize: "9.5pt" }}>
                    KODE REKENING
                  </th>
                  <th style={{ borderRight: "none", width: "26%", padding: "5px 4px", textAlign: "center", fontWeight: 700, fontSize: "9.5pt" }}>
                    JUMLAH (RP)
                  </th>
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: maxRows }).map((_, idx) => {
                  const p = paddedPend[idx];
                  const b = paddedBel[idx];
                  return (
                    <tr key={idx} style={{ height: 25 }}>
                      <td style={{ borderLeft: "none", padding: "4px 6px", textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
                        {p ? p.kd_rek6 : ""}
                      </td>
                      <td style={{ padding: "4px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                        {p ? formatCurrencyRupiah(p.nilai) : ""}
                      </td>
                      <td style={{ padding: "4px 6px", textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
                        {b ? b.kd_rek6 : ""}
                      </td>
                      <td style={{ borderRight: "none", padding: "4px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                        {b ? formatCurrencyRupiah(b.nilai) : ""}
                      </td>
                    </tr>
                  );
                })}

                {/* Baris Total */}
                <tr style={{ fontWeight: 800, fontSize: "10pt" }}>
                  <td style={{ borderLeft: "none", borderTop: "2px solid #000", padding: "6px 6px", textAlign: "left" }}>
                    Jumlah Pendapatan (Rp)
                  </td>
                  <td style={{ borderTop: "2px solid #000", padding: "6px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {formatCurrencyRupiah(totalPend)}
                  </td>
                  <td style={{ borderTop: "2px solid #000", padding: "6px 6px", textAlign: "left" }}>
                    Jumlah Belanja (Rp)
                  </td>
                  <td style={{ borderRight: "none", borderTop: "2px solid #000", padding: "6px 8px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                    {formatCurrencyRupiah(totalBel)}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* BAGIAN 6: BLOK TANDA TANGAN (PENGGUNA ANGGARAN KADINKES) */}
            <div style={{ padding: "20px 24px 20px 24px", display: "flex", justifyContent: "flex-end", fontSize: "10.5pt", pageBreakInside: "avoid" }}>
              <div style={{ textAlign: "center", minWidth: 260, maxWidth: 320 }}>
                <div>Sipirok, {tglFormatted}</div>
                <div style={{ fontWeight: 700, marginTop: 4 }}>PENGGUNA ANGGARAN</div>
                <div style={{ fontWeight: 700, lineHeight: "1.3" }}>
                  {jabatanPenandatangan}
                </div>

                {/* Spasi Tanda Tangan */}
                <div style={{ height: 68 }} />

                {/* Nama Pejabat */}
                <div style={{ fontWeight: 700, textDecoration: "underline", letterSpacing: "0.2px" }}>
                  {namaPenandatangan}
                </div>

                {/* Pangkat & Golongan (jika ada) */}
                {pangkatPenandatangan && (
                  <div style={{ fontSize: "9.5pt", marginTop: 1 }}>
                    {pangkatPenandatangan}
                  </div>
                )}

                {/* NIP */}
                <div style={{ marginTop: 2, fontSize: "10pt" }}>
                  {nipPenandatangan ? `NIP. ${nipPenandatangan}` : ""}
                </div>
              </div>
            </div>
          </div>
        </article>
      </main>

      {/* Floating Action Button (FAB) Cetak Dokumen - Memudahkan cetak saat scroll dokumen */}
      <div
        className="no-print"
        style={{
          position: "fixed",
          bottom: "28px",
          right: "28px",
          zIndex: 20,
        }}
      >
        <button
          onClick={() => window.print()}
          className="btn-cetak-sp3b-fab"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            padding: "12px 22px",
            backgroundColor: "#2563EB",
            backgroundImage: "linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)",
            color: "#FFFFFF",
            fontSize: "13.5px",
            fontWeight: 700,
            borderRadius: "9999px",
            border: "1px solid #60A5FA",
            cursor: "pointer",
            boxShadow: "0 8px 24px rgba(30, 58, 138, 0.5), 0 2px 6px rgba(37, 99, 235, 0.3)",
            transition: "all 0.2s ease",
            letterSpacing: "0.2px",
          }}
          title="Cetak Dokumen SP3B (Ctrl+P)"
        >
          <Printer size={18} />
          <span>Cetak Dokumen</span>
        </button>
      </div>
    </div>
  );
}

export default function CetakSp3bPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", backgroundColor: "#E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 36, height: 36, border: "4px solid #2563EB", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 12px" }}></div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>Memuat halaman cetak SP3B...</div>
        </div>
      </div>
    }>
      <CetakSp3bContent />
    </Suspense>
  );
}