"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Printer, FileText, CheckCircle2 } from "lucide-react";

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
  const searchParams = useSearchParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paperSize, setPaperSize] = useState<"A4" | "Folio">("Folio");

  const no_sp3b = searchParams.get("no_sp3b") || "";
  const kd_upt = searchParams.get("kd_upt") || "";

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
        <p className="font-medium text-sm">Menyiapkan pratinjau dokumen SP3B...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-sans">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full text-center border border-red-200">
          <p className="text-red-600 font-medium text-sm mb-4">{error || "Data SP3B tidak ditemukan"}</p>
          <button
            onClick={() => window.close()}
            className="px-4 py-2 bg-slate-800 text-white rounded text-xs font-semibold hover:bg-slate-700 transition-colors"
          >
            Tutup Halaman
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

  const maxRows = Math.max(rincianPendapatan.length, rincianBelanja.length, 1);
  const paddedPend: any[] = [...rincianPendapatan, ...Array(Math.max(0, maxRows - rincianPendapatan.length)).fill(null)];
  const paddedBel: any[] = [...rincianBelanja, ...Array(Math.max(0, maxRows - rincianBelanja.length)).fill(null)];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#E2E8F0", paddingBottom: 60, fontFamily: "sans-serif" }}>
      {/* TOOLBAR HEADBOARD PROFESIONAL */}
      <div className="no-print" style={{ backgroundColor: "#0F172A", padding: "10px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", color: "#fff", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 2px 10px rgba(0,0,0,0.15)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => window.close()}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", backgroundColor: "#334155", color: "#F8FAFC", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 500, transition: "all 0.2s" }}
          >
            <ArrowLeft size={15} /> Tutup
          </button>
          <div style={{ height: 18, width: 1, backgroundColor: "#475569" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FileText size={18} className="text-blue-400" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#F8FAFC" }}>Pratinjau SP3B / SP2B</span>
            <span style={{ fontSize: 11, backgroundColor: "#1E293B", color: "#94A3B8", padding: "2px 8px", borderRadius: 4, border: "1px solid #334155", fontFamily: "monospace" }}>{no_sp3b}</span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, backgroundColor: "#1E293B", padding: "4px 8px", borderRadius: 6, border: "1px solid #334155" }}>
            <span style={{ fontSize: 12, color: "#94A3B8" }}>Kertas:</span>
            <button
              onClick={() => setPaperSize("Folio")}
              style={{ padding: "3px 10px", fontSize: 12, borderRadius: 4, border: "none", cursor: "pointer", fontWeight: 600, backgroundColor: paperSize === "Folio" ? "#2563EB" : "transparent", color: paperSize === "Folio" ? "#FFF" : "#94A3B8" }}
            >
              Folio / F4
            </button>
            <button
              onClick={() => setPaperSize("A4")}
              style={{ padding: "3px 10px", fontSize: 12, borderRadius: 4, border: "none", cursor: "pointer", fontWeight: 600, backgroundColor: paperSize === "A4" ? "#2563EB" : "transparent", color: paperSize === "A4" ? "#FFF" : "#94A3B8" }}
            >
              A4
            </button>
          </div>

          <button
            onClick={() => window.print()}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 18px", backgroundColor: "#2563EB", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600, fontSize: 13, boxShadow: "0 2px 4px rgba(37,99,235,0.3)" }}
          >
            <Printer size={16} /> Cetak Dokumen
          </button>
        </div>
      </div>

      {/* DOKUMEN CANVAS CONTAINER */}
      <div style={{ padding: "32px 16px", display: "flex", justifyContent: "center" }}>
        {/* LEMBAR CETAK */}
        <div
          className="print-sheet"
          style={{
            width: sheetWidth,
            backgroundColor: "#FFFFFF",
            padding: 0,
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            fontFamily: "'Times New Roman', Times, serif",
            fontSize: "11pt",
            color: "#000",
            boxSizing: "border-box",
            border: "2px solid #000"
          }}
        >
          <style dangerouslySetInnerHTML={{
            __html: `
            @media print {
              body { background-color: transparent !important; margin: 0 !important; padding: 0 !important; }
              .no-print { display: none !important; }
              .print-sheet { width: 100% !important; margin: 0 !important; box-shadow: none !important; border: 2px solid #000 !important; }
              @page { size: ${pageSizeStyle}; margin: 12mm; }
            }
          ` }} />

          {/* 1. KOP SURAT */}
          <table style={{ width: "100%", borderCollapse: "collapse", borderBottom: "2px solid #000" }}>
            <tbody>
              <tr>
                <td style={{ width: "22%", padding: "12px 8px", textAlign: "center", verticalAlign: "middle", borderRight: "2px solid #000" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/logo-tapsel.png" alt="Logo Tapanuli Selatan" style={{ width: 75, height: "auto", objectFit: "contain" }} />
                </td>
                <td style={{ padding: "8px 12px", textAlign: "center", verticalAlign: "middle" }}>
                  <div style={{ fontSize: "12pt", fontWeight: 700, letterSpacing: "0.3px" }}>PEMERINTAH KABUPATEN TAPANULI SELATAN</div>
                  <div style={{ fontSize: "13pt", fontWeight: 700, marginTop: 2, letterSpacing: "0.3px" }}>DINAS KESEHATAN DAERAH</div>
                  <div style={{ marginTop: 8, fontSize: "10pt", fontWeight: 700 }}>SURAT PERMINTAAN PENGESAHAN BELANJA (SP2B) Puskesmas</div>
                  <div style={{ fontSize: "10pt", fontWeight: 700, marginTop: 2 }}>TANGGAL : {tglFormatted}, NOMOR : {no_sp3b}</div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* 2. KALIMAT PENGANTAR */}
          <div style={{ borderBottom: "2px solid #000", fontSize: "10.5pt", lineHeight: "1.4" }}>
            <div style={{ padding: "4px 8px", borderBottom: "1px solid #000" }}>
              Kepala Dinas Kesehatan Daerah Kabupaten Tapanuli Selatan memohon kepada :
            </div>
            <div style={{ padding: "4px 8px", borderBottom: "1px solid #000" }}>
              Bendahara Umum Daerah Selaku PPKD
            </div>
            <div style={{ padding: "4px 8px" }}>
              Agar Mengesahkan dan membukukan pendapatan dan belanja dana {sumdan} sejumlah :
            </div>
          </div>

          {/* 3. RINCIAN SALDO */}
          <div style={{ borderBottom: "2px solid #000", padding: "6px 8px" }}>
            <table style={{ borderCollapse: "collapse", fontSize: "10.5pt" }}>
              <tbody>
                {[
                  { label: "1. Saldo Awal", val: saldoAwal },
                  { label: "2. Pendapatan", val: totalPend },
                  { label: "3. Belanja", val: totalBel },
                  { label: "4. Saldo Akhir", val: saldoAkhir },
                ].map(({ label, val }) => (
                  <tr key={label}>
                    <td style={{ padding: "1px 0", width: 110 }}>{label}</td>
                    <td style={{ padding: "1px 8px 1px 0", textAlign: "center", width: 12 }}>:</td>
                    <td style={{ padding: "1px 0", width: 28 }}>Rp.</td>
                    <td style={{ padding: "1px 0", textAlign: "right", minWidth: 90 }}>
                      {formatCurrencyRupiah(val)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* 4. TABEL UTAMA */}
          <table style={{ width: "100%", borderCollapse: "collapse", borderBottom: "2px solid #000", fontSize: "10pt" }}>
            <tbody>
              <tr>
                <td style={{ border: "1px solid #000", borderTop: "none", borderLeft: "none", padding: "5px 4px", textAlign: "center", width: "22%" }}>Untuk Bulan</td>
                <td style={{ border: "1px solid #000", borderTop: "none", padding: "5px 4px", textAlign: "center", width: "28%" }}>{BULAN_NAMA[bulan]}</td>
                <td style={{ border: "1px solid #000", borderTop: "none", padding: "5px 4px", textAlign: "center", width: "25%" }}>Tahun Anggaran</td>
                <td style={{ border: "1px solid #000", borderTop: "none", borderRight: "none", padding: "5px 4px", textAlign: "center", width: "25%" }}>{tahunAnggaran}</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", borderLeft: "none", padding: "5px 4px", textAlign: "center" }}>Dasar Pengesahan</td>
                <td style={{ border: "1px solid #000", padding: "5px 4px", textAlign: "center" }}>Urusan</td>
                <td style={{ border: "1px solid #000", padding: "5px 4px", textAlign: "center" }}>Organisasi</td>
                <td style={{ border: "1px solid #000", borderRight: "none", padding: "5px 4px", textAlign: "center" }}>Nama Puskesmas</td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", borderLeft: "none", padding: "6px 4px", textAlign: "center", verticalAlign: "top" }}>
                  {kdKegiatan}
                </td>
                <td style={{ border: "1px solid #000", padding: "6px 4px", textAlign: "center", verticalAlign: "top" }}>
                  <div>{kdProgram}</div>
                  <div style={{ marginTop: 2 }}>Program :</div>
                  <div>{kdSubKegiatan}</div>
                </td>
                <td style={{ border: "1px solid #000", padding: "6px 4px", textAlign: "center", verticalAlign: "top" }}>
                  <div>Dinas Kesehatan Daerah</div>
                  <div style={{ marginTop: 2 }}>Kegiatan :</div>
                  <div>{kdKegiatan}.01.00</div>
                </td>
                <td style={{ border: "1px solid #000", borderRight: "none", padding: "6px 4px", textAlign: "center", verticalAlign: "top" }}>
                  {nm_upt || upt?.nm_upt || "Puskesmas Batang Toru"}
                </td>
              </tr>

              <tr>
                <td colSpan={2} style={{ border: "1px solid #000", borderLeft: "none", padding: "5px 4px", textAlign: "center", fontWeight: 700 }}>
                  PENDAPATAN
                </td>
                <td colSpan={2} style={{ border: "1px solid #000", borderRight: "none", padding: "5px 4px", textAlign: "center", fontWeight: 700 }}>
                  BELANJA
                </td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", borderLeft: "none", padding: "6px 4px", textAlign: "center", fontWeight: 700, width: "25%" }}>
                  KODE REKENING
                </td>
                <td style={{ border: "1px solid #000", padding: "6px 4px", textAlign: "center", fontWeight: 700, width: "25%" }}>
                  JUMLAH<br />(RP)
                </td>
                <td style={{ border: "1px solid #000", padding: "6px 4px", textAlign: "center", fontWeight: 700, width: "25%" }}>
                  KODE REKENING
                </td>
                <td style={{ border: "1px solid #000", borderRight: "none", padding: "6px 4px", textAlign: "center", fontWeight: 700, width: "25%" }}>
                  JUMLAH<br />(RP)
                </td>
              </tr>

              {Array.from({ length: maxRows }).map((_, idx) => {
                const p = paddedPend[idx];
                const b = paddedBel[idx];
                return (
                  <tr key={idx}>
                    <td style={{ border: "1px solid #000", borderLeft: "none", padding: "6px 8px", textAlign: "center" }}>
                      {p ? p.kd_rek6 : ""}
                    </td>
                    <td style={{ border: "1px solid #000", padding: "6px 8px", textAlign: "right" }}>
                      {p ? formatCurrencyRupiah(p.nilai) : ""}
                    </td>
                    <td style={{ border: "1px solid #000", padding: "6px 8px", textAlign: "center" }}>
                      {b ? b.kd_rek6 : ""}
                    </td>
                    <td style={{ border: "1px solid #000", borderRight: "none", padding: "6px 8px", textAlign: "right" }}>
                      {b ? formatCurrencyRupiah(b.nilai) : ""}
                    </td>
                  </tr>
                );
              })}

              <tr style={{ fontWeight: 700 }}>
                <td style={{ border: "1px solid #000", borderLeft: "none", padding: "6px 8px" }}>
                  Jumlah Pendapatan (Rp)
                </td>
                <td style={{ border: "1px solid #000", padding: "6px 8px", textAlign: "right" }}>
                  {formatCurrencyRupiah(totalPend)}
                </td>
                <td style={{ border: "1px solid #000", padding: "6px 8px" }}>
                  Jumlah Belanja (Rp)
                </td>
                <td style={{ border: "1px solid #000", borderRight: "none", padding: "6px 8px", textAlign: "right" }}>
                  {formatCurrencyRupiah(totalBel)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* 5. BLOK TANDA TANGAN */}
          <div style={{ padding: "24px 24px 20px 24px", display: "flex", justifyContent: "flex-end", fontSize: "10.5pt" }}>
            <div style={{ textAlign: "center", minWidth: 260 }}>
              <div>Sipirok, {tglCetak.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</div>
              <div style={{ fontWeight: 700, marginTop: 4 }}>PENGGUNA ANGGARAN</div>
              <div style={{ fontWeight: 700 }}>
                {penandatanganKadis?.jabatan?.toUpperCase() || jabatan_kadis || "KEPALA DINAS KESEHATAN DAERAH"}
              </div>
              <div style={{ height: 65 }} />
              <div style={{ fontWeight: 700, textDecoration: "underline" }}>
                {penandatanganKadis?.nama || nm_kadis || data?.nm_kadis || "dr. SRI KHAIRUNNISA, MH, MKM"}
              </div>
              {(penandatanganKadis?.pangkat_golongan || pangkat_kadis) && (
                <div style={{ fontSize: "9.5pt", color: "#334155", marginTop: 1 }}>
                  {penandatanganKadis?.pangkat_golongan || pangkat_kadis}
                </div>
              )}
              <div style={{ marginTop: 2 }}>
                NIP. {penandatanganKadis?.nip || nip_kadis || data?.nip_kadis || "197112262002122008"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CetakSp3bPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", backgroundColor: "#E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
        Memuat halaman pratinjau SP3B...
      </div>
    }>
      <CetakSp3bContent />
    </Suspense>
  );
}