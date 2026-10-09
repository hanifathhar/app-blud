"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";

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

function CetakSp3bContent() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paperSize, setPaperSize] = useState<"A4" | "Folio">("Folio");

  const no_sp3b = searchParams.get("no_sp3b") || "";
  const kd_upt = searchParams.get("kd_upt") || "";

  useEffect(() => {
    const fetchSp3bDetail = async () => {
      try {
        const res = await fetch(`/api/verifikasi/sp3b/detail?no_sp3b=${encodeURIComponent(no_sp3b)}&kd_upt=${kd_upt}`);
        const result = await res.json();

        if (res.ok && result.success) {
          setData(result.data);
          setTimeout(() => {
            window.print();
          }, 600);
        } else {
          setError(result.error || "Gagal memuat dokumen SP3B");
        }
      } catch (err: any) {
        setError("Terjadi kesalahan koneksi saat memuat dokumen SP3B");
      } finally {
        setLoading(false);
      }
    };

    if (no_sp3b && kd_upt) {
      fetchSp3bDetail();
    }
  }, [no_sp3b, kd_upt]);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", fontFamily: "sans-serif" }}>
        Menyiapkan dokumen Surat Permintaan Pengesahan Pendapatan dan Belanja (SP3B)...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "red", fontFamily: "sans-serif" }}>
        {error || "Data SP3B tidak ditemukan"}
      </div>
    );
  }

  const {
    nm_upt = "",
    tgl_sp3b,
    bulan = 1,
    sumdan = "BLUD",
    no_lpj = "",
    total_pendapatan = 0,
    total_belanja = 0,
    rincianPendapatan = [],
    rincianBelanja = [],
    upt,
  } = data;

  const pageSizeStyle = paperSize === "A4" ? "210mm 297mm" : "215mm 330mm";
  const sheetWidth = paperSize === "A4" ? "210mm" : "215mm";
  const sheetMinHeight = paperSize === "A4" ? "297mm" : "330mm";

  const tglCetak = tgl_sp3b ? new Date(tgl_sp3b) : new Date();

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F1F5F9", paddingBottom: 60 }}>
      {/* Tombol Aksi Layar / No-Print Bar */}
      <div className="no-print" style={{ backgroundColor: "#1E293B", padding: "12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "#fff", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={() => window.close()}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", backgroundColor: "#334155", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 13 }}
          >
            <ArrowLeft size={16} /> Tutup
          </button>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Cetak Dokumen SP3B - {no_sp3b}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
            <span>Ukuran Kertas:</span>
            <select
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value as any)}
              style={{ padding: "4px 8px", borderRadius: 4, border: "1px solid #64748B", backgroundColor: "#0F172A", color: "#fff", fontSize: 12 }}
            >
              <option value="Folio">F4 / Folio (215 x 330 mm)</option>
              <option value="A4">A4 (210 x 297 mm)</option>
            </select>
          </div>

          <button
            onClick={() => window.print()}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 18px", backgroundColor: "#2563EB", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 700, fontSize: 13 }}
          >
            <Printer size={16} /> Cetak / PDF
          </button>
        </div>
      </div>

      {/* Lembar Dokumen Cetak */}
      <div
        className="print-sheet"
        style={{
          width: sheetWidth,
          minHeight: sheetMinHeight,
          margin: "24px auto",
          backgroundColor: "#FFFFFF",
          padding: "24mm 20mm 20mm 20mm",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
          fontFamily: "'Bookman Old Style', 'Times New Roman', serif",
          fontSize: "10pt",
          color: "#000",
          boxSizing: "border-box",
        }}
      >
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body {
              background-color: transparent !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .no-print {
              display: none !important;
            }
            .print-sheet {
              width: 100% !important;
              min-height: auto !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
            }
            @page {
              size: ${pageSizeStyle};
              margin: 15mm 15mm 15mm 15mm;
            }
          }
        ` }} />

        {/* Kop Surat Resmi */}
        <div style={{ textAlign: "center", borderBottom: "3px double #000", paddingBottom: 10, marginBottom: 16 }}>
          <div style={{ fontSize: "12pt", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
            PEMERINTAH KABUPATEN TAPANULI SELATAN
          </div>
          <div style={{ fontSize: "14pt", fontWeight: 800, textTransform: "uppercase", margin: "2px 0" }}>
            DINAS KESEHATAN
          </div>
          <div style={{ fontSize: "11pt", fontWeight: 700, textTransform: "uppercase" }}>
            {nm_upt || "UPT PUSKESMAS"}
          </div>
          <div style={{ fontSize: "8.5pt", fontStyle: "italic", marginTop: 2 }}>
            {upt?.alamat || "Komplek Perkantoran Pemerintahan Kabupaten Tapanuli Selatan"}
          </div>
        </div>

        {/* Judul Dokumen */}
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: "11pt", fontWeight: 800, textDecoration: "underline", textTransform: "uppercase" }}>
            SURAT PERMINTAAN PENGESAHAN PENDAPATAN DAN BELANJA (SP3B)
          </div>
          <div style={{ fontSize: "9.5pt", marginTop: 4 }}>
            Nomor: <b>{no_sp3b}</b>
          </div>
        </div>

        {/* Informasi Pengesahan */}
        <table style={{ width: "100%", fontSize: "9.5pt", marginBottom: 14, borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ width: 140, padding: "2px 0", verticalAlign: "top" }}>Unit Kerja (UPT)</td>
              <td style={{ width: 10, padding: "2px 0", verticalAlign: "top" }}>:</td>
              <td style={{ padding: "2px 0", fontWeight: 700 }}>[{kd_upt}] {nm_upt}</td>
            </tr>
            <tr>
              <td style={{ padding: "2px 0", verticalAlign: "top" }}>Periode Bulan</td>
              <td style={{ padding: "2px 0", verticalAlign: "top" }}>:</td>
              <td style={{ padding: "2px 0" }}>{BULAN_NAMA[bulan]} (Berdasarkan LPJ No: <b>{no_lpj}</b>)</td>
            </tr>
            <tr>
              <td style={{ padding: "2px 0", verticalAlign: "top" }}>Sumber Dana</td>
              <td style={{ padding: "2px 0", verticalAlign: "top" }}>:</td>
              <td style={{ padding: "2px 0" }}>{sumdan}</td>
            </tr>
          </tbody>
        </table>

        {/* Tabel Rincian Pendapatan & Belanja */}
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "8.5pt", marginBottom: 16, border: "1px solid #000" }}>
          <thead>
            <tr style={{ backgroundColor: "#F1F5F9", textAlign: "center" }}>
              <th style={{ border: "1px solid #000", padding: "6px 8px", width: 30 }}>NO</th>
              <th style={{ border: "1px solid #000", padding: "6px 8px", width: 110 }}>KODE REKENING</th>
              <th style={{ border: "1px solid #000", padding: "6px 8px", textAlign: "left" }}>URAIAN PENDAPATAN DAN BELANJA</th>
              <th style={{ border: "1px solid #000", padding: "6px 8px", textAlign: "right", width: 130 }}>JUMLAH (RP)</th>
            </tr>
          </thead>
          <tbody>
            {/* Bagian Pendapatan */}
            <tr style={{ backgroundColor: "#F8FAFC", fontWeight: 700 }}>
              <td style={{ border: "1px solid #000", padding: "5px 8px", textAlign: "center" }}>1</td>
              <td style={{ border: "1px solid #000", padding: "5px 8px", textAlign: "center" }}>4</td>
              <td style={{ border: "1px solid #000", padding: "5px 8px" }}>PENDAPATAN BLUD</td>
              <td style={{ border: "1px solid #000", padding: "5px 8px", textAlign: "right" }}>{formatCurrencyRupiah(total_pendapatan)}</td>
            </tr>
            {rincianPendapatan.map((p: any, idx: number) => (
              <tr key={`p-${idx}`}>
                <td style={{ border: "1px solid #000", padding: "4px 8px", textAlign: "center" }}></td>
                <td style={{ border: "1px solid #000", padding: "4px 8px", textAlign: "center", fontFamily: "monospace" }}>{p.kd_rek6}</td>
                <td style={{ border: "1px solid #000", padding: "4px 8px", paddingLeft: 20 }}>{p.nm_rek6}</td>
                <td style={{ border: "1px solid #000", padding: "4px 8px", textAlign: "right" }}>{formatCurrencyRupiah(p.nilai)}</td>
              </tr>
            ))}

            {/* Bagian Belanja */}
            <tr style={{ backgroundColor: "#F8FAFC", fontWeight: 700 }}>
              <td style={{ border: "1px solid #000", padding: "5px 8px", textAlign: "center" }}>2</td>
              <td style={{ border: "1px solid #000", padding: "5px 8px", textAlign: "center" }}>5</td>
              <td style={{ border: "1px solid #000", padding: "5px 8px" }}>BELANJA BLUD</td>
              <td style={{ border: "1px solid #000", padding: "5px 8px", textAlign: "right" }}>{formatCurrencyRupiah(total_belanja)}</td>
            </tr>
            {rincianBelanja.map((b: any, idx: number) => (
              <tr key={`b-${idx}`}>
                <td style={{ border: "1px solid #000", padding: "4px 8px", textAlign: "center" }}></td>
                <td style={{ border: "1px solid #000", padding: "4px 8px", textAlign: "center", fontFamily: "monospace" }}>{b.kd_rek6}</td>
                <td style={{ border: "1px solid #000", padding: "4px 8px", paddingLeft: 20 }}>
                  {b.nm_rek6}
                  {b.nm_sub_kegiatan && <span style={{ fontSize: "7.5pt", color: "#475569", display: "block" }}>Sub Kegiatan: {b.nm_sub_kegiatan}</span>}
                </td>
                <td style={{ border: "1px solid #000", padding: "4px 8px", textAlign: "right" }}>{formatCurrencyRupiah(b.nilai)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ fontWeight: 800, backgroundColor: "#F1F5F9" }}>
              <td colSpan={3} style={{ border: "1px solid #000", padding: "6px 8px", textAlign: "right", textTransform: "uppercase" }}>
                Saldo / Jumlah Total Transaksi
              </td>
              <td style={{ border: "1px solid #000", padding: "6px 8px", textAlign: "right" }}>
                {formatCurrencyRupiah(Number(total_pendapatan) + Number(total_belanja))}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Bagian Tanda Tangan */}
        <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between", fontSize: "9pt", pageBreakInside: "avoid" }}>
          <div style={{ textAlign: "center", width: 220 }}>
            <div>Mengetahui,</div>
            <div style={{ fontWeight: 700 }}>Kepala Dinas Kesehatan</div>
            <div style={{ marginTop: 60, fontWeight: 700, textDecoration: "underline" }}>
              ( .................................................. )
            </div>
            <div>NIP. ..................................................</div>
          </div>

          <div style={{ textAlign: "center", width: 240 }}>
            <div>Sipirok, {tglCetak.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</div>
            <div style={{ fontWeight: 700 }}>Pejabat Pengelola Keuangan BLUD</div>
            <div style={{ marginTop: 60, fontWeight: 700, textDecoration: "underline" }}>
              {data.username || "Subag Keuangan Dinkes"}
            </div>
            <div>NIP. ..................................................</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CetakSp3bPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center" }}>Memuat halaman cetak SP3B...</div>}>
      <CetakSp3bContent />
    </Suspense>
  );
}
