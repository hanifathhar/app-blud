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
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function CetakBastPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [upt, setUpt] = useState<any>(null);
  const [subGiat, setSubGiat] = useState<any>(null);
  const [penandatanganKpa, setPenandatanganKpa] = useState<any>(null);
  const [penandatanganPengurusBarang, setPenandatanganPengurusBarang] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paperSize, setPaperSize] = useState<"A4" | "Folio">("A4");

  const id = params?.id;

  useEffect(() => {
    if (!id) return;

    const fetchBast = async () => {
      try {
        const res = await fetch(`/api/penatausahaan/belanja/penerimaan/${id}/cetak`);
        const result = await res.json();

        if (res.ok && result.data) {
          setData(result.data);
          setUpt(result.upt);
          setSubGiat(result.subGiat);
          setPenandatanganKpa(result.penandatanganKpa);
          setPenandatanganPengurusBarang(result.penandatanganPengurusBarang);

          setTimeout(() => {
            window.print();
          }, 600);
        } else {
          setError(result.error || "Gagal mengambil data penerimaan BAST");
        }
      } catch (err: any) {
        setError("Terjadi kesalahan koneksi saat memuat data cetak BAST");
      } finally {
        setLoading(false);
      }
    };

    fetchBast();
  }, [id]);

  const handleKembali = () => {
    router.push("/dashboard/penatausahaan/belanja/penerimaan");
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", fontFamily: "sans-serif" }}>
        Menyiapkan dokumen Berita Acara Penerimaan Barang (BAST)...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "red", fontFamily: "sans-serif" }}>
        {error || "Data penerimaan BAST tidak ditemukan"}
      </div>
    );
  }

  const pengadaan = data.pengadaan || {};
  const rincianList = pengadaan.rincian || [];
  const totalNilai =
    rincianList.reduce((acc: number, item: any) => acc + (Number(item.total) || 0), 0) ||
    Number(pengadaan.nilai_kontrak) ||
    0;

  // Nama Kegiatan & Rekening
  const subGiatText = pengadaan.nm_sub_kegiatan || subGiat?.nm_sub_kegiatan || "";
  const kodeSubGiatText = pengadaan.kd_sub_kegiatan || subGiat?.kd_sub_kegiatan || "";
  const kegiatanDisplay = kodeSubGiatText && subGiatText
    ? `${kodeSubGiatText} - ${subGiatText}`
    : subGiatText || kodeSubGiatText || "-";

  // Ambil rekening dari rincian pertama jika ada
  const firstRincian = rincianList[0] || {};
  const kdRek6 = firstRincian.kd_rek6 || "";
  const nmRek6 = firstRincian.nm_rek6 || "";
  const rekeningDisplay = kdRek6 && nmRek6
    ? `${kdRek6} - ${nmRek6}`
    : nmRek6 || kdRek6 || "-";

  // Info Daerah / Kota
  const kotaKabupaten = upt?.kabupaten || upt?.kecamatan || "Sipirok";

  // Info Pejabat Pengurus Barang / Penerima (dari ms_penandatanganan / penandatanganPengurusBarang)
  const namaPengurusBarang = penandatanganPengurusBarang?.nama || "................................................";
  const nipPengurusBarang = penandatanganPengurusBarang?.nip || "";
  const jabatanPengurusBarang = penandatanganPengurusBarang?.jabatan || "Pengurus Barang Pengguna";

  // Info KPA / Kepala Dinas (dari ms_penandatanganan / penandatanganKpa)
  const jabatanKpa = penandatanganKpa?.jabatan || "KEPALA DINAS KESEHATAN";
  const namaKpa = penandatanganKpa?.nama || "................................................";
  const nipKpa = penandatanganKpa?.nip || "";

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

        .bast-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
          margin-bottom: 20px;
          font-size: 13px;
        }

        .bast-table th, .bast-table td {
          border: 1px solid #000;
          padding: 6px 8px;
        }

        .bast-table th {
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
        <div style={{ textAlign: "center", marginBottom: "25px", marginTop: "5px" }}>
          <h1
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              textDecoration: "underline",
              letterSpacing: "0.5px",
              margin: 0,
            }}
          >
            BERITA ACARA PENERIMAAN BARANG
          </h1>
          <div style={{ fontSize: "14px", marginTop: "4px" }}>
            Nomor : {data.no_bast || "-"}
          </div>
        </div>

        {/* Section: Yang bertanda tangan di bawah ini */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{ marginBottom: "6px" }}>Yang bertanda tangan di bawah ini :</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px", marginLeft: "15px" }}>
            <tbody>
              <tr>
                <td style={{ width: "90px", padding: "2px 0", verticalAlign: "top" }}>Nama</td>
                <td style={{ width: "15px", padding: "2px 0", verticalAlign: "top" }}>:</td>
                <td style={{ padding: "2px 0", verticalAlign: "top" }}>{namaPengurusBarang}</td>
              </tr>
              <tr>
                <td style={{ padding: "2px 0", verticalAlign: "top" }}>NIP.</td>
                <td style={{ padding: "2px 0", verticalAlign: "top" }}>:</td>
                <td style={{ padding: "2px 0", verticalAlign: "top" }}>{nipPengurusBarang || "-"}</td>
              </tr>
              <tr>
                <td style={{ padding: "2px 0", verticalAlign: "top" }}>Jabatan</td>
                <td style={{ padding: "2px 0", verticalAlign: "top" }}>:</td>
                <td style={{ padding: "2px 0", verticalAlign: "top" }}>{jabatanPengurusBarang}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Paragraf Dasar Pengadaan / Order Pesanan */}
        <div style={{ textAlign: "justify", marginBottom: "16px", textIndent: "0px", lineHeight: "1.5" }}>
          Berdasarkan Order Pesanan/Pembelian Barang Nomor : <strong>...{pengadaan.no_kontrak || "-"}...</strong> tanggal <strong>...{formatDateIndo(pengadaan.tgl_kontrak)}...</strong> telah menerima barang yang di serahkan oleh perusahaan <strong>...{pengadaan.nm_vendor || "-"}...</strong> alamat <strong>...{pengadaan.alamat_vendor || "-"}...</strong> dalam keadaan baik dengan uraian sebagai berikut :
        </div>

        {/* Kegiatan & Rekening */}
        <div style={{ width: "100%", marginBottom: "16px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13.5px" }}>
            <tbody>
              <tr>
                <td style={{ width: "100px", padding: "3px 0", verticalAlign: "top" }}>Kegiatan</td>
                <td style={{ width: "15px", padding: "3px 0", verticalAlign: "top" }}>:</td>
                <td style={{ padding: "3px 0", verticalAlign: "top" }}>{kegiatanDisplay}</td>
              </tr>
              <tr>
                <td style={{ padding: "3px 0", verticalAlign: "top" }}>Rekening</td>
                <td style={{ padding: "3px 0", verticalAlign: "top" }}>:</td>
                <td style={{ padding: "3px 0", verticalAlign: "top" }}>{rekeningDisplay}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Items Table */}
        <table className="bast-table">
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
                    <div>{r.volume} {r.satuan ? "" : ""}</div>
                    {r.satuan && <div style={{ fontSize: "12px" }}>{r.satuan}</div>}
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

        {/* Penutup */}
        <div style={{ marginBottom: "25px" }}>
          Demikian berita acara ini dibuat, untuk dapat dibuat seperlunya.
        </div>

        {/* Signatures (Baris 1: Yang menyerahkan di Kiri, Pengurus Barang di Kanan) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px",
            pageBreakInside: "avoid",
          }}
        >
          {/* Vendor Signature */}
          <div style={{ textAlign: "center" }}>
            <div>Yang menyerahkan,</div>
            <div style={{ fontWeight: "bold", marginTop: "2px" }}>{pengadaan.nm_vendor || "PENYEDIA / VENDOR"}</div>
            <div style={{ height: "65px" }}></div>
            <div style={{ fontWeight: "bold", textDecoration: "underline" }}>
              ................................................
            </div>
            <div style={{ fontSize: "13px", marginTop: "2px" }}>Direktur /Pengawas</div>
          </div>

          {/* Pengurus Barang Signature */}
          <div style={{ textAlign: "center" }}>
            <div>{kotaKabupaten}, {formatDateIndo(data.tgl_bast)}</div>
            <div style={{ fontWeight: "bold", marginTop: "2px" }}>{jabatanPengurusBarang}</div>
            <div style={{ height: "65px" }}></div>
            <div style={{ fontWeight: "bold", textDecoration: "underline" }}>
              {namaPengurusBarang}
            </div>
            <div style={{ fontSize: "13px", marginTop: "2px" }}>
              {nipPengurusBarang ? `NIP. ${nipPengurusBarang}` : ""}
            </div>
          </div>
        </div>

        {/* Signatures (Baris 2: Diketahui/disetujui Kepala Dinas / KPA di Tengah Bawah) */}
        <div
          style={{
            marginTop: "30px",
            textAlign: "center",
            pageBreakInside: "avoid",
          }}
        >
          <div>Diketahui/disetujui,</div>
          <div style={{ fontWeight: "bold", marginTop: "2px" }}>{jabatanKpa.toUpperCase()}</div>
          <div style={{ height: "65px" }}></div>
          <div style={{ fontWeight: "bold", textDecoration: "underline" }}>
            {namaKpa}
          </div>
          <div style={{ fontSize: "13px", marginTop: "2px" }}>
            {nipKpa ? `NIP. ${nipKpa}` : ""}
          </div>
        </div>
      </div>
    </div>
  );
}
