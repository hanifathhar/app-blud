"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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

function CetakSptjContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paperSize, setPaperSize] = useState<"A4" | "Folio">("Folio");

  const bulan = searchParams.get("bulan") || "1";
  const tahun = searchParams.get("tahun") || new Date().getFullYear().toString();
  const kd_upt = searchParams.get("kd_upt") || "";
  const sumdan = searchParams.get("sumdan") || "Dana kapitasi JKN";

  const bulanNum = parseInt(bulan);
  const tahunNum = parseInt(tahun);

  useEffect(() => {
    const fetchSptjCetak = async () => {
      try {
        const res = await fetch(`/api/pelaporan/lpj/cetak?bulan=${bulan}&tahun=${tahun}&kd_upt=${kd_upt}&sumdan=${encodeURIComponent(sumdan)}`);
        const result = await res.json();

        if (res.ok && result.success) {
          setData(result);
          setTimeout(() => {
            window.print();
          }, 600);
        } else {
          setError(result.error || "Gagal memuat dokumen SPTJ");
        }
      } catch (err: any) {
        setError("Terjadi kesalahan koneksi saat memuat dokumen SPTJ");
      } finally {
        setLoading(false);
      }
    };

    fetchSptjCetak();
  }, [bulan, tahun, kd_upt, sumdan]);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", fontFamily: "sans-serif" }}>
        Menyiapkan dokumen Surat Pernyataan Tanggung Jawab (SPTJ)...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "red", fontFamily: "sans-serif" }}>
        {error || "Data SPTJ tidak ditemukan"}
      </div>
    );
  }

  const {
    no_lpj = "",
    totalPendapatan = 0,
    totalBelanja = 0,
    pairedRows = [],
    upt,
    penandatanganKpa,
  } = data;

  const pageSizeStyle = paperSize === "A4" ? "210mm 297mm" : "215mm 330mm";
  const sheetWidth = paperSize === "A4" ? "210mm" : "215mm";
  const sheetMinHeight = paperSize === "A4" ? "297mm" : "330mm";

  const namaUpt = upt?.nm_upt ? upt.nm_upt.toUpperCase() : "PUSKESMAS";
  const alamatUpt = upt?.alamat || upt?.nm_upt || "Tapanuli Selatan";
  const tempatTtd = upt?.nm_upt ? upt.nm_upt.replace(/puskesmas\s*/i, "") : "Pargarutan";

  const namaKpa = penandatanganKpa?.nama || "................................................";
  const nipKpa = penandatanganKpa?.nip || "";
  const jabatanKpa = penandatanganKpa?.jabatan || `Kepala UPT ${upt?.nm_upt || "Puskesmas"}`;

  const lastDay = getLastDayOfMonth(tahunNum, bulanNum);
  const tglTtdStr = `${tempatTtd}, ${lastDay} ${BULAN_NAMA[bulanNum]} ${tahun}`;

  return (
    <div className="cetak-page-container">
      <style jsx global>{`
        @page {
          size: ${pageSizeStyle} portrait;
          margin: 15mm 18mm;
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
            padding: 20mm 18mm;
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

        .sptj-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 14px;
          margin-bottom: 16px;
          font-size: 11px;
        }

        .sptj-table th, .sptj-table td {
          border: 1px solid #000;
          padding: 3.5px 6px;
        }

        .sptj-table th {
          font-weight: bold;
          text-align: center;
          background-color: #fff;
          font-size: 11px;
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
              fontSize: "12.5px",
              fontWeight: paperSize === "Folio" ? 600 : 400,
              color: paperSize === "Folio" ? "#2563EB" : "#64748B",
              backgroundColor: paperSize === "Folio" ? "#EFF6FF" : "transparent",
              border: paperSize === "Folio" ? "1px solid #BFDBFE" : "1px solid transparent",
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
              fontSize: "12.5px",
              fontWeight: paperSize === "A4" ? 600 : 400,
              color: paperSize === "A4" ? "#2563EB" : "#64748B",
              backgroundColor: paperSize === "A4" ? "#EFF6FF" : "transparent",
              border: paperSize === "A4" ? "1px solid #BFDBFE" : "1px solid transparent",
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
            fontSize: "14px",
            fontWeight: 500,
            color: "white",
            backgroundColor: "#2563EB",
            border: "none",
            borderRadius: "9999px",
            cursor: "pointer",
            boxShadow: "0 2px 4px rgba(37, 99, 235, 0.3)",
          }}
        >
          <Printer size={16} /> Cetak SPTJ
        </button>
      </div>

      {/* Printable Sheet */}
      <div
        className="cetak-sheet"
        style={{
          color: "#000",
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: "12px",
          lineHeight: "1.45",
        }}
      >
        {/* Header Kop */}
        <div style={{ textAlign: "center", marginBottom: "4px" }}>
          <h2 style={{ fontSize: "14px", fontWeight: "bold", margin: "0", letterSpacing: "0.5px" }}>
            PEMERINTAH KABUPATEN TAPANULI SELATAN
          </h2>
          <h1 style={{ fontSize: "16px", fontWeight: "bold", margin: "2px 0 0 0", letterSpacing: "0.5px" }}>
            {namaUpt}
          </h1>
          <p style={{ fontSize: "12px", margin: "2px 0 0 0" }}>
            Alamat : {alamatUpt}
          </p>
        </div>

        {/* Divider Line */}
        <div style={{ borderBottom: "3px solid #000", marginTop: "8px", marginBottom: "14px" }} />

        {/* Title SPTJ */}
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "13.5px", fontWeight: "bold", textDecoration: "underline", margin: "0", letterSpacing: "0.5px" }}>
            SURAT PERNYATAAN TANGGUNG JAWAB
          </h2>
          <div style={{ fontSize: "12px", fontWeight: "bold", marginTop: "2px" }}>
            Nomor : {no_lpj}
          </div>
        </div>

        {/* Metadata FKTP & SKPD */}
        <div style={{ width: "100%", marginBottom: "12px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <tbody>
              <tr>
                <td style={{ width: "140px", padding: "1px 0", verticalAlign: "top" }}>Nama FKTP</td>
                <td style={{ width: "15px", padding: "1px 0", verticalAlign: "top" }}>:</td>
                <td style={{ padding: "1px 0", verticalAlign: "top" }}>{upt?.nm_upt || namaUpt}</td>
              </tr>
              <tr>
                <td style={{ padding: "1px 0", verticalAlign: "top" }}>Nama SKPD</td>
                <td style={{ padding: "1px 0", verticalAlign: "top" }}>:</td>
                <td style={{ padding: "1px 0", verticalAlign: "top" }}>Dinas Kesehatan Daerah</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Paragraf Pernyataan */}
        <p style={{ textAlign: "justify", textIndent: "0", margin: "0 0 10px 0", fontSize: "12px" }}>
          Yang bertandatangan dibawah ini ...<strong>{namaKpa}</strong>... menyatakan bahwa saya bertanggung jawab atas semua realisasi pendapatan yang telah di terima dan di belajakan telah dibayar kepada yang berhak menerima, yang dananya bersumber dari {sumdan} dan di gunakan langsung oleh FKTP pada bulan ...<strong>{BULAN_NAMA[bulanNum]?.toUpperCase()}</strong>... tahun anggaran ...<strong>{tahun}</strong>... dengan rincian sebagai berikut :
        </p>

        {/* Tabel Berdampingan Pendapatan vs Belanja */}
        <table className="sptj-table">
          <thead>
            <tr>
              <th colSpan={2} style={{ width: "45%" }}>PENDAPATAN</th>
              <th colSpan={2} style={{ width: "55%" }}>BELANJA</th>
            </tr>
            <tr>
              <th style={{ width: "23%" }}>KODE<br />REKENING</th>
              <th style={{ width: "22%" }}>JUMLAH<br />(RP)</th>
              <th style={{ width: "32%" }}>KODE<br />REKENING</th>
              <th style={{ width: "23%" }}>JUMLAH<br />(RP)</th>
            </tr>
          </thead>
          <tbody>
            {pairedRows.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: "12px", fontStyle: "italic" }}>
                  Tidak ada data transaksi pada periode ini
                </td>
              </tr>
            ) : (
              pairedRows.map((row: any, idx: number) => {
                const p = row.pendapatan;
                const b = row.belanja;

                return (
                  <tr key={idx}>
                    {/* Pendapatan */}
                    <td style={{ textAlign: p?.kd_rek6 ? "center" : "right", verticalAlign: "top", fontSize: "11px", wordBreak: "break-all" }}>
                      {p?.kd_rek6 || ""}
                    </td>
                    <td style={{ textAlign: "right", verticalAlign: "top", fontSize: "11px", whiteSpace: "nowrap" }}>
                      {p ? formatCurrencyRupiah(p.jumlah) : "0.00"}
                    </td>

                    {/* Belanja */}
                    <td style={{ verticalAlign: "top", fontSize: "10.5px", wordBreak: "break-all" }}>
                      {b?.full_kd_rek || ""}
                    </td>
                    <td style={{ textAlign: "right", verticalAlign: "top", fontSize: "11px", whiteSpace: "nowrap" }}>
                      {b ? formatCurrencyRupiah(b.jumlah) : "0.00"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot>
            <tr style={{ fontWeight: "bold" }}>
              <td>Jumlah Pendapatan</td>
              <td style={{ textAlign: "right" }}>{formatCurrencyRupiah(totalPendapatan)}</td>
              <td>Jumlah Belanja</td>
              <td style={{ textAlign: "right" }}>{formatCurrencyRupiah(totalBelanja)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Klausul Penutup */}
        <p style={{ textAlign: "justify", margin: "10px 0 6px 0", fontSize: "12px" }}>
          Bukti-bukti pendapatan dana/atau belanja di atas disimpan sesuai ketentuan yang berlaku untuk kelengkapan administrasi dan keperluan pemeriksaan aparat pengawas. apabila di kemudian hari terjadi kerugian daerah, saya bersedia bertanggung jawab sepenuhnya atas kerugian daerah maksud dan dapat dituntut penggantian dengan ketentuan peratusran perundang-undangan.
        </p>
        <p style={{ margin: "0 0 20px 0", fontSize: "12px" }}>
          Demikian surat pernyataan ini dibuat dengan sebenarnya.
        </p>

        {/* Tanda Tangan */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "16px", pageBreakInside: "avoid" }}>
          <div style={{ textAlign: "center", width: "260px" }}>
            <div>{tglTtdStr}</div>
            <div style={{ fontWeight: "bold", marginTop: "2px" }}>
              {jabatanKpa}
            </div>
            <div style={{ height: "65px" }}></div>
            <div style={{ fontWeight: "bold" }}>
              {namaKpa}
            </div>
            <div style={{ fontSize: "11.5px", marginTop: "2px" }}>
              {nipKpa ? `NIP. ${nipKpa}` : ""}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CetakSptjPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center" }}>Memuat dokumen SPTJ...</div>}>
      <CetakSptjContent />
    </Suspense>
  );
}
