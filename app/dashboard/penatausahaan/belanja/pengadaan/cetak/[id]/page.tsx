"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  return `${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function CetakOrderPembelianPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [upt, setUpt] = useState<any>(null);
  const [penandatanganPptk, setPenandatanganPptk] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paperSize, setPaperSize] = useState<"A4" | "Folio">("A4");

  const id = params?.id;

  useEffect(() => {
    if (!id) return;

    const fetchPengadaan = async () => {
      try {
        const res = await fetch(`/api/penatausahaan/belanja/pengadaan/${id}/cetak`);
        const result = await res.json();

        if (res.ok && result.data) {
          setData(result.data);
          setUpt(result.upt);
          setPenandatanganPptk(result.penandatanganPptk);

          setTimeout(() => {
            window.print();
          }, 600);
        } else {
          setError(result.error || "Gagal mengambil data pengadaan");
        }
      } catch (err: any) {
        setError("Terjadi kesalahan koneksi saat memuat data cetak");
      } finally {
        setLoading(false);
      }
    };

    fetchPengadaan();
  }, [id]);

  const handleKembali = () => {
    router.push(`/dashboard/penatausahaan/belanja/pengadaan/edit/${id}`);
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", fontFamily: "sans-serif" }}>
        Menyiapkan dokumen Order Pembelian (OP)...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "red", fontFamily: "sans-serif" }}>
        {error || "Data pengadaan tidak ditemukan"}
      </div>
    );
  }

  const rincianList = data.rincian || [];
  const totalNilai = rincianList.reduce((acc: number, item: any) => acc + (Number(item.total) || 0), 0) || Number(data.nilai_kontrak) || 0;
  const namaUpt = upt?.nm_upt || data.permintaan_belanja?.nm_upt || "Puskesmas";

  const pageSizeStyle = paperSize === "A4" ? "210mm 297mm" : "215mm 330mm";
  const sheetWidth = paperSize === "A4" ? "210mm" : "215mm";
  const sheetMinHeight = paperSize === "A4" ? "297mm" : "330mm";

  return (
    <div className="cetak-page-container">
      <style jsx global>{`
        @page {
          size: ${pageSizeStyle} portrait;
          margin: 15mm 20mm;
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
            padding: 20mm 20mm;
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

        .op-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          margin-bottom: 25px;
          font-size: 13px;
        }

        .op-table th, .op-table td {
          border: 1px solid #000;
          padding: 6px 8px;
        }

        .op-table th {
          font-weight: bold;
          text-align: center;
          background-color: #fff;
          text-transform: uppercase;
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
          onClick={handleKembali}
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
          <ArrowLeft size={16} /> Kembali
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
          fontSize: "13.5px",
          lineHeight: "1.4",
        }}
      >
        {/* Title */}
        <div style={{ textAlign: "center", marginBottom: "30px", marginTop: "10px" }}>
          <h1
            style={{
              fontSize: "18px",
              fontWeight: "bold",
              textDecoration: "underline",
              letterSpacing: "0.5px",
              margin: 0,
            }}
          >
            ORDER PEMBELIAN (OP)
          </h1>
        </div>

        {/* Metadata section */}
        <div style={{ width: "100%", marginBottom: "20px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
            <tbody>
              <tr>
                <td style={{ width: "130px", padding: "3px 0", verticalAlign: "top" }}>Nomor</td>
                <td style={{ width: "15px", padding: "3px 0", verticalAlign: "top" }}>:</td>
                <td style={{ padding: "3px 0", verticalAlign: "top" }}>{data.no_kontrak || "-"}</td>
              </tr>
              <tr>
                <td style={{ padding: "3px 0", verticalAlign: "top" }}>Tanggal</td>
                <td style={{ padding: "3px 0", verticalAlign: "top" }}>:</td>
                <td style={{ padding: "3px 0", verticalAlign: "top" }}>{formatDateIndo(data.tgl_kontrak)}</td>
              </tr>
              <tr>
                <td style={{ padding: "3px 0", verticalAlign: "top" }}>Kepada Yth.</td>
                <td style={{ padding: "3px 0", verticalAlign: "top" }}>:</td>
                <td style={{ padding: "3px 0", verticalAlign: "top", fontWeight: "bold" }}>{data.nm_vendor || "-"}</td>
              </tr>
              <tr>
                <td style={{ padding: "3px 0", verticalAlign: "top" }}>Alamat</td>
                <td style={{ padding: "3px 0", verticalAlign: "top" }}>:</td>
                <td style={{ padding: "3px 0", verticalAlign: "top" }}>{data.alamat_vendor || "-"}</td>
              </tr>
              <tr>
                <td style={{ padding: "3px 0", verticalAlign: "top" }}>Untuk</td>
                <td style={{ padding: "3px 0", verticalAlign: "top" }}>:</td>
                <td style={{ padding: "3px 0", verticalAlign: "top" }}>{data.uraian || "-"}</td>
              </tr>
              <tr>
                <td style={{ padding: "3px 0", verticalAlign: "top" }}>Kepentingan</td>
                <td style={{ padding: "3px 0", verticalAlign: "top" }}>:</td>
                <td style={{ padding: "3px 0", verticalAlign: "top" }}>{namaUpt}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Items Table */}
        <table className="op-table">
          <thead>
            <tr>
              <th style={{ width: "45px" }}>NO.</th>
              <th>NAMA BARANG</th>
              <th style={{ width: "120px" }}>MEREK/TYPE</th>
              <th style={{ width: "110px" }}>VOLUME</th>
              <th style={{ width: "110px" }}>HARGA</th>
              <th style={{ width: "125px" }}>TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {rincianList.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "16px" }}>
                  Tidak ada rincian barang
                </td>
              </tr>
            ) : (
              rincianList.map((r: any, idx: number) => (
                <tr key={idx}>
                  <td style={{ textAlign: "center", verticalAlign: "top" }}>{idx + 1}</td>
                  <td style={{ verticalAlign: "top" }}>{r.uraian || r.nm_rek6 || "-"}</td>
                  <td style={{ verticalAlign: "top", textAlign: "center" }}>{r.merek || ""}</td>
                  <td style={{ verticalAlign: "top", textAlign: "center" }}>
                    {r.volume} {r.satuan || ""}
                  </td>
                  <td style={{ verticalAlign: "top", textAlign: "right" }}>
                    {formatCurrencyRupiah(Number(r.harga) || 0)}
                  </td>
                  <td style={{ verticalAlign: "top", textAlign: "right" }}>
                    {formatCurrencyRupiah(Number(r.total) || 0)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          <tfoot>
            <tr>
              <td
                colSpan={5}
                style={{
                  fontWeight: "bold",
                  letterSpacing: "4px",
                  padding: "6px 8px",
                }}
              >
                T O T A L :
              </td>
              <td
                style={{
                  textAlign: "right",
                  fontWeight: "bold",
                  padding: "6px 8px",
                }}
              >
                {formatCurrencyRupiah(totalNilai)}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Signatures (2 Columns) */}
        <div
          style={{
            marginTop: "30px",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px",
            pageBreakInside: "avoid",
          }}
        >
          {/* Vendor Signature */}
          <div style={{ textAlign: "center" }}>
            <div>Yang menerima order barang,</div>
            <div style={{ fontWeight: "bold", marginTop: "2px" }}>{data.nm_vendor || "PENYEDIA / VENDOR"}</div>
            <div style={{ height: "70px" }}></div>
            <div style={{ fontWeight: "bold" }}>
              ................................................
            </div>
            <div style={{ fontSize: "13px", marginTop: "2px" }}>Direktur /Pengawas</div>
          </div>

          {/* PPTK Signature */}
          <div style={{ textAlign: "center" }}>
            <div>Yang mengorder barang,</div>
            <div style={{ fontWeight: "bold", marginTop: "2px" }}>PPTK</div>
            <div style={{ height: "70px" }}></div>
            <div style={{ fontWeight: "bold", textDecoration: "underline" }}>
              {penandatanganPptk?.nama || "................................................"}
            </div>
            <div style={{ fontSize: "13px", marginTop: "2px" }}>
              {penandatanganPptk?.nip ? `NIP. ${penandatanganPptk.nip}` : ""}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
