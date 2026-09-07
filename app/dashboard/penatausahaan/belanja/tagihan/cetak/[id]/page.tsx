"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { terbilangRupiah } from "@/lib/terbilang";

function formatCurrencyRupiah(val: number) {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
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

export default function CetakKwitansiPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [upt, setUpt] = useState<any>(null);
  const [penandatanganKpa, setPenandatanganKpa] = useState<any>(null);
  const [penandatanganPptk, setPenandatanganPptk] = useState<any>(null);
  const [penandatanganBendahara, setPenandatanganBendahara] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const id = params?.id;

  useEffect(() => {
    if (!id) return;

    const fetchKwitansi = async () => {
      try {
        const res = await fetch(`/api/penatausahaan/belanja/tagihan/${id}/cetak`);
        const result = await res.json();

        if (res.ok && result.data) {
          setData(result.data);
          setUpt(result.upt);
          setPenandatanganKpa(result.penandatanganKpa);
          setPenandatanganPptk(result.penandatanganPptk);
          setPenandatanganBendahara(result.penandatanganBendahara);

          setTimeout(() => {
            window.print();
          }, 600);
        } else {
          setError(result.error || "Gagal mengambil data tagihan");
        }
      } catch (err: any) {
        setError("Terjadi kesalahan koneksi saat memuat data");
      } finally {
        setLoading(false);
      }
    };

    fetchKwitansi();
  }, [id]);

  const handleKembali = () => {
    router.push("/dashboard/penatausahaan/belanja/tagihan");
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", fontFamily: "sans-serif" }}>
        Menyiapkan dokumen cetak kwitansi...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "red", fontFamily: "sans-serif" }}>
        {error || "Data kwitansi tidak ditemukan"}
      </div>
    );
  }

  // Nama UPT dan Instansi
  const namaUptClean = (upt?.nm_upt || data.nm_upt || "").replace(/puskesmas\s*/i, "").trim();
  const puskesmasTitle = upt?.nm_upt || data.nm_upt || "PUSKESMAS";
  const headerUptNama = puskesmasTitle.toUpperCase();

  // Penerima Info
  const namaPenerima =
    data.nm_vendor ||
    data.penerimaan_barang?.pengadaan?.nm_vendor ||
    data.permintaan_belanja?.nm_ukm ||
    "-";

  const alamatPenerima =
    data.penerimaan_barang?.pengadaan?.alamat_vendor ||
    namaUptClean ||
    "-";

  // Nilai & Terbilang
  const nilaiTotal = Number(data.nilai_tagihan || 0);
  const terbilangText = terbilangRupiah(nilaiTotal);

  // Kode Rekening
  const firstRincian = data.rincian?.[0];
  const kodeRek =
    data.kd_rek6 ||
    firstRincian?.kd_rek6 ||
    data.permintaan_belanja?.kd_sub_kegiatan ||
    "-";

  // No BKU
  const noBku = data.bku?.[0]?.no_bku || data.pengeluaran?.no_pengeluaran || "";

  return (
    <div style={{ backgroundColor: "#F8FAFC", minHeight: "100vh", padding: "24px 0", boxSizing: "border-box" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: A4 portrait;
          margin: 15mm 15mm 15mm 15mm;
        }
        @media print {
          body {
            background: #fff !important;
          }
          header, nav, aside, .sidebar, .page-header, .no-print {
            display: none !important;
          }
          .page-layout, .page-main, .page-content, main {
            margin: 0 !important;
            padding: 0 !important;
            background: transparent !important;
            box-shadow: none !important;
            border: none !important;
            display: block !important;
          }
          #print-area {
            width: 100% !important;
            min-height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}} />

      {/* Floating Toolbar - Sembunyi saat diprint */}
      <div className="no-print" style={{ 
        position: "sticky", 
        top: 24, 
        zIndex: 50, 
        display: "flex", 
        justifyContent: "center",
        marginBottom: 32 
      }}>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 8, 
          padding: "6px 8px", 
          backgroundColor: "rgba(255, 255, 255, 0.9)", 
          backdropFilter: "blur(8px)",
          borderRadius: 999, 
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          border: "1px solid #E2E8F0"
        }}>
          <button 
            onClick={handleKembali}
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 6, 
              padding: "6px 12px", 
              borderRadius: 999, 
              backgroundColor: "transparent", 
              color: "#64748B", 
              border: "none", 
              cursor: "pointer", 
              fontSize: 12, 
              fontWeight: 600, 
              transition: "all 0.2s" 
            }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = "#F1F5F9"; e.currentTarget.style.color = "#0F172A"; }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#64748B"; }}
          >
            <ArrowLeft size={14} />
            Kembali
          </button>
          
          <div style={{ width: 1, height: 16, backgroundColor: "#E2E8F0" }}></div>

          <button 
            onClick={() => window.print()}
            style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: 6, 
              padding: "6px 14px", 
              borderRadius: 999, 
              backgroundColor: "#0F172A", 
              color: "#fff", 
              border: "none", 
              cursor: "pointer", 
              fontSize: 12, 
              fontWeight: 600, 
              transition: "all 0.2s" 
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#334155"}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#0F172A"}
          >
            <Printer size={14} />
            Cetak Dokumen
          </button>
        </div>
      </div>

      {/* Dokumen Kwitansi Print Area */}
      <div id="print-area" style={{ 
        backgroundColor: "#fff", 
        width: "21cm", 
        minHeight: "29.7cm", 
        padding: "1.8cm 1.6cm", 
        boxSizing: "border-box", 
        fontFamily: "'Times New Roman', Times, serif", 
        fontSize: "11pt", 
        lineHeight: "1.35",
        color: "#000", 
        margin: "0 auto", 
        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", 
        border: "1px solid #E2E8F0" 
      }}>
        {/* Header Dokumen */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div>
            <div style={{ fontSize: "11pt", fontWeight: "bold" }}>
              Nomor : {data.no_tagihan || "-"}
            </div>
            <h1 style={{ fontSize: "16pt", fontWeight: "bold", margin: "6px 0 0 0", letterSpacing: "0.5px" }}>
              KWITANSI (TANDA PEMBAYARAN)
            </h1>
          </div>
          <div style={{ minWidth: "260px" }}>
            <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "10pt" }}>
              <tbody>
                <tr>
                  <td style={{ padding: "1px 4px", width: "75px" }}>Tanggal</td>
                  <td style={{ padding: "1px 4px", width: "10px" }}>:</td>
                  <td style={{ padding: "1px 4px" }}>{formatDateIndo(data.tgl_tagihan)}</td>
                </tr>
                <tr>
                  <td style={{ padding: "1px 4px" }}>No BKU</td>
                  <td style={{ padding: "1px 4px" }}>:</td>
                  <td style={{ padding: "1px 4px" }}>{noBku || ""}</td>
                </tr>
                <tr>
                  <td style={{ padding: "1px 4px", verticalAlign: "top" }}>Kode Rek</td>
                  <td style={{ padding: "1px 4px", verticalAlign: "top" }}>:</td>
                  <td style={{ padding: "1px 4px", wordBreak: "break-all" }}>{kodeRek}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Sudah Terima Dari */}
        <div style={{ margin: "22px 0 16px 0", fontWeight: "bold", fontSize: "11.5pt", textTransform: "uppercase" }}>
          SUDAH TERIMA DARI BENDAHARA PENGELUARAN {headerUptNama} TAPANULI SELATAN
        </div>

        {/* Banyaknya (Nominal & Terbilang) */}
        <div style={{ marginTop: "14px", marginBottom: "8px" }}>
          <div style={{ fontWeight: "bold", fontSize: "10.5pt", marginBottom: "6px" }}>
            BANYAKNYA :
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            borderBottom: "1.5px solid #000",
            paddingBottom: "8px",
            marginBottom: "12px",
            gap: "24px"
          }}>
            <div style={{ fontWeight: "bold", fontSize: "11pt", minWidth: "160px" }}>
              Rp&emsp;&emsp;&emsp;{formatCurrencyRupiah(nilaiTotal)}
            </div>
            <div style={{ fontStyle: "italic", fontSize: "11pt" }}>
              ( {terbilangText} )
            </div>
          </div>
        </div>

        {/* Yaitu untuk */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "26px", marginTop: "10px" }}>
          <div style={{ fontWeight: "bold", minWidth: "110px", fontSize: "11pt" }}>
            Yaitu untuk :
          </div>
          <div style={{ fontSize: "10.5pt", textAlign: "justify", lineHeight: "1.45", flex: 1 }}>
            {data.keterangan || "-"}
          </div>
        </div>

        {/* Garis Pembatas Tebal */}
        <div style={{ borderBottom: "3.5px solid #000", marginBottom: "28px" }} />

        {/* Blok 4 Tanda Tangan */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr 1.1fr 1.2fr",
          gap: "10px",
          fontSize: "9.5pt",
          lineHeight: "1.3",
          pageBreakInside: "avoid"
        }}>
          {/* Kolom 1: KPA */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ marginBottom: "2px" }}>Setuju dibayar,</div>
              <div style={{ fontWeight: "normal" }}>
                {penandatanganKpa?.jabatan || `Kepala UPT ${puskesmasTitle}`},
              </div>
              <div style={{ fontWeight: "bold", textTransform: "uppercase", fontSize: "9pt" }}>
                SELAKU KUASA PENGGUNA ANGGARAN/BARANG
              </div>
            </div>
            <div style={{ marginTop: "65px" }}>
              <div style={{ fontWeight: "bold" }}>
                {penandatanganKpa?.nama || "......................................................."}
              </div>
              {penandatanganKpa?.pangkat_golongan && (
                <div style={{ textTransform: "uppercase", fontSize: "8.5pt" }}>
                  {penandatanganKpa.pangkat_golongan}
                </div>
              )}
              <div style={{ fontSize: "9pt" }}>
                {penandatanganKpa?.nip ? `NIP. ${penandatanganKpa.nip}` : "NIP. ................................................."}
              </div>
            </div>
          </div>

          {/* Kolom 2: PPTK */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ marginBottom: "2px" }}>Diketahui Oleh :</div>
              <div style={{ fontWeight: "bold" }}>
                {penandatanganPptk?.jabatan || "PPTK"}
              </div>
            </div>
            <div style={{ marginTop: "65px" }}>
              <div style={{ fontWeight: "bold" }}>
                {penandatanganPptk?.nama || "......................................................."}
              </div>
              {penandatanganPptk?.pangkat_golongan && (
                <div style={{ fontSize: "8.5pt" }}>
                  {penandatanganPptk.pangkat_golongan}
                </div>
              )}
              <div style={{ fontSize: "9pt" }}>
                {penandatanganPptk?.nip ? `NIP. ${penandatanganPptk.nip}` : "NIP. ................................................."}
              </div>
            </div>
          </div>

          {/* Kolom 3: Bendahara Pengeluaran */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ marginBottom: "2px" }}>Dibayar Oleh :</div>
              <div style={{ fontWeight: "bold", textTransform: "uppercase" }}>
                {penandatanganBendahara?.jabatan || "BENDAHARA PENGELUARAN"}
              </div>
            </div>
            <div style={{ marginTop: "65px" }}>
              <div style={{ fontWeight: "bold" }}>
                {penandatanganBendahara?.nama || "......................................................."}
              </div>
              {penandatanganBendahara?.pangkat_golongan && (
                <div style={{ fontSize: "8.5pt" }}>
                  {penandatanganBendahara.pangkat_golongan}
                </div>
              )}
              <div style={{ fontSize: "9pt" }}>
                {penandatanganBendahara?.nip ? `NIP. ${penandatanganBendahara.nip}` : "NIP."}
              </div>
            </div>
          </div>

          {/* Kolom 4: Yang Menerima */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ marginBottom: "2px" }}>,</div>
              <div style={{ fontWeight: "bold" }}>Yang Menerima :</div>
            </div>
            <div style={{ marginTop: "65px" }}>
              <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "9pt" }}>
                <tbody>
                  <tr>
                    <td style={{ padding: "1px 0", width: "60px" }}>Nama</td>
                    <td style={{ padding: "1px 4px", width: "10px" }}>:</td>
                    <td style={{ padding: "1px 0", fontWeight: "bold" }}>{namaPenerima}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "1px 0" }}>Pekerjaan</td>
                    <td style={{ padding: "1px 4px" }}>:</td>
                    <td style={{ padding: "1px 0" }}>ASN</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "1px 0" }}>Alamat</td>
                    <td style={{ padding: "1px 4px" }}>:</td>
                    <td style={{ padding: "1px 0" }}>{alamatPenerima}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
