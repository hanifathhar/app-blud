"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ArrowLeft, Printer, FileText } from "lucide-react";

function formatCurrencyRupiah(val: number) {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val || 0);
}

function formatDateIndo(dateStr?: string | Date | null) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

const BULAN_NAMA = [
  "", "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
  "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
];

function CetakBkuContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paperSize, setPaperSize] = useState<"A4" | "Folio">("Folio");

  const bulan = searchParams.get("bulan") || "1";
  const tahun = searchParams.get("tahun") || new Date().getFullYear().toString();
  const kd_upt = searchParams.get("kd_upt") || "";

  useEffect(() => {
    const fetchBkuCetak = async () => {
      try {
        const res = await fetch(`/api/penatausahaan/bku/cetak?bulan=${bulan}&tahun=${tahun}&kd_upt=${kd_upt}`);
        const result = await res.json();

        if (res.ok && result.success) {
          setData(result);
          setTimeout(() => {
            window.print();
          }, 600);
        } else {
          setError(result.error || "Gagal memuat data cetak BKU");
        }
      } catch (err: any) {
        setError("Terjadi kesalahan koneksi saat memuat dokumen BKU");
      } finally {
        setLoading(false);
      }
    };

    fetchBkuCetak();
  }, [bulan, tahun, kd_upt]);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", fontFamily: "sans-serif" }}>
        Menyiapkan dokumen Buku Kas Umum (BKU)...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "red", fontFamily: "sans-serif" }}>
        {error || "Data BKU tidak ditemukan"}
      </div>
    );
  }

  const {
    saldoBulanLalu = 0,
    totalDebet = 0,
    totalKredit = 0,
    saldoAkhir = 0,
    items = [],
    upt,
    penandatanganKpa,
    penandatanganBendahara,
  } = data;

  const pageSizeStyle = paperSize === "A4" ? "297mm 210mm" : "330mm 215mm";
  const sheetWidth = paperSize === "A4" ? "297mm" : "330mm";
  const sheetMinHeight = paperSize === "A4" ? "210mm" : "215mm";

  const namaUpt = upt?.nm_upt ? upt.nm_upt.toUpperCase() : "PUSKESMAS";
  const kodeUpt = upt?.kd_upt || kd_upt || "-";
  const urusanText = "1.02 - Kesehatan";

  const namaKpa = penandatanganKpa?.nama || "................................................";
  const nipKpa = penandatanganKpa?.nip || "";

  const namaBendahara = penandatanganBendahara?.nama || "................................................";
  const nipBendahara = penandatanganBendahara?.nip || "";

  return (
    <div className="cetak-page-container">
      <style jsx global>{`
        @page {
          size: ${pageSizeStyle} landscape;
          margin: 12mm 15mm;
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
            padding: 15mm 15mm;
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

        .bku-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          margin-bottom: 20px;
          font-size: 11.5px;
        }

        .bku-table th, .bku-table td {
          border: 1px solid #000;
          padding: 4px 5px;
        }

        .bku-table th {
          font-weight: bold;
          text-align: center;
          background-color: #fff;
          text-transform: uppercase;
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
          <Printer size={16} /> Cetak Dokumen
        </button>
      </div>

      {/* Printable Sheet */}
      <div
        className="cetak-sheet"
        style={{
          color: "#000",
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: "12px",
          lineHeight: "1.35",
        }}
      >
        {/* Header Title */}
        <div style={{ textAlign: "center", marginBottom: "18px" }}>
          <h2 style={{ fontSize: "14px", fontWeight: "bold", margin: "0 0 2px 0", letterSpacing: "0.5px" }}>
            PEMERINTAH KABUPATEN TAPANULI SELATAN
          </h2>
          <h1 style={{ fontSize: "15px", fontWeight: "bold", margin: "0 0 2px 0", letterSpacing: "0.5px" }}>
            BUKU KAS UMUM PENGELUARAN
          </h1>
          <h3 style={{ fontSize: "13px", fontWeight: "bold", margin: "0", letterSpacing: "0.5px" }}>
            PERIODE {BULAN_NAMA[parseInt(bulan)]} {tahun}
          </h3>
        </div>

        {/* Metadata Header Langsung ke Unit/UPT sesuai permintaan user */}
        <div style={{ width: "100%", marginBottom: "14px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
            <tbody>
              <tr>
                <td style={{ width: "220px", padding: "1.5px 0", verticalAlign: "top" }}>Urusan Pemerintahan</td>
                <td style={{ width: "15px", padding: "1.5px 0", verticalAlign: "top" }}>:</td>
                <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>{urusanText}</td>
              </tr>
              <tr>
                <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>Unit / UPT</td>
                <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>:</td>
                <td style={{ padding: "1.5px 0", verticalAlign: "top", fontWeight: "bold" }}>{kodeUpt} - {namaUpt}</td>
              </tr>
              <tr>
                <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>Pengguna / Kuasa Pengguna Anggaran</td>
                <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>:</td>
                <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>{namaKpa}</td>
              </tr>
              <tr>
                <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>Bendahara Pengeluaran</td>
                <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>:</td>
                <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>{namaBendahara}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Main BKU Table */}
        <table className="bku-table">
          <thead>
            <tr>
              <th style={{ width: "45px" }}>NO URUT</th>
              <th style={{ width: "65px" }}>TANGGAL</th>
              <th style={{ width: "175px" }}>KODE REKENING</th>
              <th>URAIAN</th>
              <th style={{ width: "95px" }}>PENERIMAAN</th>
              <th style={{ width: "95px" }}>PENGELUARAN</th>
              <th style={{ width: "105px" }}>SALDO</th>
            </tr>
            <tr style={{ backgroundColor: "#F8FAFC", fontSize: "10px" }}>
              <th>1</th>
              <th>2</th>
              <th>3</th>
              <th>4</th>
              <th>5</th>
              <th>6</th>
              <th>7</th>
            </tr>
          </thead>
          <tbody>
            {/* Saldo Bulan Lalu */}
            <tr>
              <td style={{ textAlign: "center" }}></td>
              <td style={{ textAlign: "center" }}></td>
              <td></td>
              <td style={{ fontWeight: "bold" }}>SALDO BULAN LALU</td>
              <td style={{ textAlign: "right" }}></td>
              <td style={{ textAlign: "right" }}></td>
              <td style={{ textAlign: "right", fontWeight: "bold" }}>
                {formatCurrencyRupiah(saldoBulanLalu)}
              </td>
            </tr>

            {/* List Transaksi */}
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "16px", fontStyle: "italic" }}>
                  Tidak ada transaksi pada periode ini
                </td>
              </tr>
            ) : (
              items.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td style={{ textAlign: "center", verticalAlign: "top", fontSize: "11px" }}>{item.no_urut}</td>
                  <td style={{ textAlign: "center", verticalAlign: "top", fontSize: "11px", whiteSpace: "nowrap" }}>
                    {formatDateIndo(item.tgl_transaksi)}
                  </td>
                  <td style={{ verticalAlign: "top", fontSize: "11px", wordBreak: "break-all" }}>
                    {item.full_kd_rek || item.kd_rek6 || "-"}
                  </td>
                  <td style={{ verticalAlign: "top" }}>
                    {item.no_bukti && (
                      <div style={{ fontWeight: 600, fontSize: "11px", color: "#1E293B" }}>{item.no_bukti}</div>
                    )}
                    <div>{item.uraian || "-"}</div>
                    {item.nm_rek6 && (
                      <div style={{ fontSize: "10.5px", color: "#475569", fontStyle: "italic", marginTop: "2px" }}>
                        Rek: {item.nm_rek6}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: "right", verticalAlign: "top" }}>
                    {item.debet > 0 ? formatCurrencyRupiah(item.debet) : ""}
                  </td>
                  <td style={{ textAlign: "right", verticalAlign: "top" }}>
                    {item.kredit > 0 ? formatCurrencyRupiah(item.kredit) : ""}
                  </td>
                  <td style={{ textAlign: "right", verticalAlign: "top", fontWeight: 500 }}>
                    {formatCurrencyRupiah(item.saldo)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr style={{ fontWeight: "bold" }}>
              <td colSpan={4} style={{ textAlign: "center", letterSpacing: "2px" }}>
                JUMLAH BULAN INI :
              </td>
              <td style={{ textAlign: "right" }}>{formatCurrencyRupiah(totalDebet)}</td>
              <td style={{ textAlign: "right" }}>{formatCurrencyRupiah(totalKredit)}</td>
              <td style={{ textAlign: "right" }}>{formatCurrencyRupiah(saldoAkhir)}</td>
            </tr>
          </tfoot>
        </table>

        {/* Signatures */}
        <div
          style={{
            marginTop: "30px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px",
            pageBreakInside: "avoid",
          }}
        >
          {/* KPA Signature */}
          <div style={{ textAlign: "center" }}>
            <div>Mengetahui,</div>
            <div style={{ fontWeight: "bold", marginTop: "2px" }}>
              Kuasa Pengguna Anggaran (KPA)
            </div>
            <div style={{ height: "65px" }}></div>
            <div style={{ fontWeight: "bold", textDecoration: "underline" }}>
              {namaKpa}
            </div>
            <div style={{ fontSize: "11.5px", marginTop: "2px" }}>
              {nipKpa ? `NIP. ${nipKpa}` : ""}
            </div>
          </div>

          {/* Bendahara Signature */}
          <div style={{ textAlign: "center" }}>
            <div>{upt?.kabupaten || upt?.kecamatan || "Sipirok"}, .................... {tahun}</div>
            <div style={{ fontWeight: "bold", marginTop: "2px" }}>
              Bendahara Pengeluaran
            </div>
            <div style={{ height: "65px" }}></div>
            <div style={{ fontWeight: "bold", textDecoration: "underline" }}>
              {namaBendahara}
            </div>
            <div style={{ fontSize: "11.5px", marginTop: "2px" }}>
              {nipBendahara ? `NIP. ${nipBendahara}` : ""}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CetakBkuPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center" }}>Memuat dokumen BKU...</div>}>
      <CetakBkuContent />
    </Suspense>
  );
}
