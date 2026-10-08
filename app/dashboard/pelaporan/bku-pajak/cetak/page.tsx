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

function formatDateIndo(dateStr?: string | Date | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

const BULAN_NAMA = [
  "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

function getLastDayOfMonth(year: number, month: number) {
  const d = new Date(year, month, 0);
  return d.getDate();
}

function CetakBkuPajakContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paperSize, setPaperSize] = useState<"A4" | "Folio">("Folio");

  const bulan = searchParams.get("bulan") || "1";
  const tahun = searchParams.get("tahun") || new Date().getFullYear().toString();
  const kd_upt = searchParams.get("kd_upt") || "";

  const bulanNum = parseInt(bulan);
  const tahunNum = parseInt(tahun);

  useEffect(() => {
    const fetchCetak = async () => {
      try {
        const query = new URLSearchParams({
          bulan,
          tahun,
          kd_upt,
        });

        const res = await fetch(`/api/pelaporan/bku-pajak?${query.toString()}`);
        const result = await res.json();

        if (res.ok && result.success) {
          setData(result);
          setTimeout(() => {
            window.print();
          }, 600);
        } else {
          setError(result.error || "Gagal memuat data cetak Buku Pembantu Pajak");
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
        Menyiapkan dokumen Buku Pembantu Pajak...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "red", fontFamily: "sans-serif" }}>
        {error || "Data Buku Pembantu Pajak tidak ditemukan"}
      </div>
    );
  }

  const {
    upt,
    penandatanganKpa,
    penandatanganBendahara,
    saldoBulanLalu = 0,
    items = [],
    summary = {},
  } = data;

  const pageSizeStyle = paperSize === "A4" ? "297mm 210mm" : "330mm 215mm";
  const sheetWidth = paperSize === "A4" ? "297mm" : "330mm";
  const sheetMinHeight = paperSize === "A4" ? "210mm" : "215mm";

  const namaKpa = penandatanganKpa?.nama || "dr. SRI KHAIRUNNISA, MH, MKM";
  const nipKpa = penandatanganKpa?.nip || "197112262002122008";
  const jabatanKpa = penandatanganKpa?.jabatan || "KEPALA DINAS KESEHATAN DAERAH";
  const pangkatKpa = penandatanganKpa?.pangkat_golongan || "PEMBINA UTAMA MUDA/ IV.c";

  const namaBendahara = penandatanganBendahara?.nama || "SANLY MELISKA, S.K.M.";
  const nipBendahara = penandatanganBendahara?.nip || "198608262006042001";
  const jabatanBendahara = penandatanganBendahara?.jabatan || "BENDAHARA PENGELUARAN";
  const pangkatBendahara = penandatanganBendahara?.pangkat_golongan || "PENATA MUDA TK. 1";

  const lastDay = getLastDayOfMonth(tahunNum, bulanNum);
  const tglTtdStr = `Sipirok, ${String(lastDay).padStart(2, "0")} ${BULAN_NAMA[bulanNum]} ${tahun}`;

  return (
    <div className="cetak-page-container">
      <style jsx global>{`
        @page {
          size: ${pageSizeStyle} landscape;
          margin: 10mm 15mm;
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

        .tax-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
          margin-bottom: 20px;
          font-size: 10.5px;
          border: 1px solid #000;
        }

        .tax-table th, .tax-table td {
          border: 1px solid #000;
          padding: 3px 5px;
        }

        .tax-table th {
          font-weight: bold;
          text-align: center;
          background-color: #fff;
          font-size: 10.5px;
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
          <Printer size={16} /> Cetak Dokumen
        </button>
      </div>

      {/* Printable Sheet */}
      <div
        className="cetak-sheet"
        style={{
          color: "#000",
          fontFamily: "Arial, sans-serif",
          fontSize: "10.5px",
          lineHeight: "1.3",
        }}
      >
        {/* Header Title with Center Logo */}
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <h2 style={{ fontSize: "13px", fontWeight: "bold", margin: "0 0 2px 0", letterSpacing: "0.5px" }}>
            PEMERINTAH KABUPATEN TAPANULI SELATAN
          </h2>
          <h1 style={{ fontSize: "14px", fontWeight: "bold", margin: "0 0 2px 0", letterSpacing: "0.5px" }}>
            BUKU PEMBANTU PAJAK
          </h1>
          <h3 style={{ fontSize: "13px", fontWeight: "bold", margin: "0", letterSpacing: "0.5px" }}>
            BENDAHARA PENGELUARAN
          </h3>
          <p style={{ fontSize: "11px", margin: "3px 0 0 0" }}>
            PERIODE {BULAN_NAMA[bulanNum].toUpperCase()} {tahun}
          </p>
        </div>

        {/* Metadata Information List */}
        <div style={{ width: "100%", marginBottom: "12px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
            <tbody>
              <tr>
                <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>Unit/UPT</td>
                <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>:</td>
                <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>
                  {data.upt?.kd_upt ? `${data.upt?.kd_upt} - ${data.upt?.nm_upt}` : "Dinas Kesehatan Daerah"}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>NPWP</td>
                <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>:</td>
                <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>-</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Main Data Table */}
        <table className="tax-table">
          <thead>
            <tr>
              <th style={{ width: "35px" }}>NO</th>
              <th style={{ width: "75px" }}>TANGGAL</th>
              <th style={{ width: "100px" }}>NO. TRANSAKSI</th>
              <th style={{ width: "100px" }}>REF.<br /><span style={{ fontSize: 9, fontWeight: "normal" }}>(ID Billing / NTPN)</span></th>
              <th style={{ width: "120px" }}>REKENING POTONGAN</th>
              <th>URAIAN</th>
              <th style={{ width: "95px" }}>PEMOTONGAN<br />(Rp)</th>
              <th style={{ width: "95px" }}>PENYETORAN<br />(Rp)</th>
              <th style={{ width: "105px" }}>SALDO<br />(Rp)</th>
            </tr>
            <tr style={{ backgroundColor: "#fff", fontSize: "9.5px" }}>
              <th>1</th>
              <th>2</th>
              <th>3</th>
              <th>4</th>
              <th>5</th>
              <th>6</th>
              <th>7</th>
              <th>8</th>
              <th>9</th>
            </tr>
          </thead>
          <tbody>
            {/* Saldo Bulan Lalu */}
            <tr>
              <td style={{ textAlign: "center" }}></td>
              <td style={{ textAlign: "center" }}></td>
              <td></td>
              <td></td>
              <td></td>
              <td style={{ fontWeight: "bold" }}>SALDO BULAN LALU</td>
              <td style={{ textAlign: "right" }}></td>
              <td style={{ textAlign: "right" }}></td>
              <td style={{ textAlign: "right", fontWeight: "bold" }}>
                {formatCurrencyRupiah(saldoBulanLalu)}
              </td>
            </tr>

            {/* Items Transaksi */}
            {items.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: "15px 8px", color: "#666", fontStyle: "italic" }}>
                  Tidak ada transaksi pemotongan maupun penyetoran pajak pada periode ini.
                </td>
              </tr>
            ) : (
              items.map((item: any) => (
                <tr key={item.id}>
                  <td style={{ textAlign: "center" }}>{item.no_urut}</td>
                  <td style={{ textAlign: "center" }}>{formatDateIndo(item.tgl_transaksi)}</td>
                  <td style={{ textAlign: "center", fontSize: "9.5px" }}>{item.no_transaksi}</td>
                  <td style={{ textAlign: "center", fontSize: "9.5px", fontFamily: "monospace" }}>{item.ref}</td>
                  <td style={{ fontSize: "9.5px" }}>{item.rekening_potongan}</td>
                  <td>{item.uraian}</td>
                  <td style={{ textAlign: "right" }}>{item.pemotongan > 0 ? formatCurrencyRupiah(item.pemotongan) : "0,00"}</td>
                  <td style={{ textAlign: "right" }}>{item.penyetoran > 0 ? formatCurrencyRupiah(item.penyetoran) : "0,00"}</td>
                  <td style={{ textAlign: "right", fontWeight: "bold" }}>{formatCurrencyRupiah(item.saldo)}</td>
                </tr>
              ))
            )}

            {/* Baris Total Bulan Ini */}
            <tr style={{ fontWeight: "bold" }}>
              <td colSpan={6} style={{ textAlign: "right" }}>TOTAL BULAN INI</td>
              <td style={{ textAlign: "right" }}>{formatCurrencyRupiah(summary.totalPemotonganBulanIni || 0)}</td>
              <td style={{ textAlign: "right" }}>{formatCurrencyRupiah(summary.totalPenyetoranBulanIni || 0)}</td>
              <td style={{ textAlign: "right" }}>{formatCurrencyRupiah(summary.saldoAkhir || 0)}</td>
            </tr>

            {/* Baris Total s/d Bulan Lalu */}
            <tr style={{ fontWeight: "bold" }}>
              <td colSpan={6} style={{ textAlign: "right" }}>TOTAL S/D BULAN LALU</td>
              <td style={{ textAlign: "right" }}>{formatCurrencyRupiah(summary.pemotonganSdPeriodeLalu || 0)}</td>
              <td style={{ textAlign: "right" }}>{formatCurrencyRupiah(summary.penyetoranSdPeriodeLalu || 0)}</td>
              <td style={{ textAlign: "right" }}>{formatCurrencyRupiah(saldoBulanLalu)}</td>
            </tr>

            {/* Baris Total s/d Bulan Ini */}
            <tr style={{ fontWeight: "bold" }}>
              <td colSpan={6} style={{ textAlign: "right" }}>TOTAL S/D BULAN INI</td>
              <td style={{ textAlign: "right" }}>{formatCurrencyRupiah(summary.totalPemotonganSdPeriodeIni || 0)}</td>
              <td style={{ textAlign: "right" }}>{formatCurrencyRupiah(summary.totalPenyetoranSdPeriodeIni || 0)}</td>
              <td style={{ textAlign: "right" }}>{formatCurrencyRupiah(summary.saldoAkhir || 0)}</td>
            </tr>
          </tbody>
        </table>

        {/* Signature Area */}
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

export default function CetakBkuPajakPage() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: 40, textAlign: "center", fontFamily: "sans-serif" }}>
          Memuat halaman cetak...
        </div>
      }
    >
      <CetakBkuPajakContent />
    </Suspense>
  );
}
