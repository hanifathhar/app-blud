"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Printer, RefreshCw, FileText, Filter } from "lucide-react";
import Select from "react-select";
import Swal from "sweetalert2";

interface ReportRow {
  id: string;
  level: "program" | "kegiatan" | "sub_kegiatan" | "rekening";
  kode: string;
  uraian: string;
  jumlahAnggaran: number;
  apbdLalu: number;
  apbdIni: number;
  apbdSdIni: number;
  bludLalu: number;
  bludIni: number;
  bludSdIni: number;
  bokLalu: number;
  bokIni: number;
  bokSdIni: number;
  jknLalu: number;
  jknIni: number;
  jknSdIni: number;
  totalSpj: number;
  sisaAnggaran: number;
}

interface SummaryData {
  grandAnggaran: number;
  grandApbdLalu: number;
  grandApbdIni: number;
  grandApbdSdIni: number;
  grandBludLalu: number;
  grandBludIni: number;
  grandBludSdIni: number;
  grandBokLalu: number;
  grandBokIni: number;
  grandBokSdIni: number;
  grandJknLalu: number;
  grandJknIni: number;
  grandJknSdIni: number;
  grandTotalSpj: number;
  grandSisaAnggaran: number;
}

interface ReportResponse {
  success: boolean;
  bulan: number;
  tahun: number;
  kd_upt: string;
  upt: any;
  penandatanganKpa: any;
  penandatanganBendahara: any;
  rows: ReportRow[];
  summary: SummaryData;
}

const BULAN_OPTIONS = [
  { value: "1", label: "Januari" },
  { value: "2", label: "Februari" },
  { value: "3", label: "Maret" },
  { value: "4", label: "April" },
  { value: "5", label: "Mei" },
  { value: "6", label: "Juni" },
  { value: "7", label: "Juli" },
  { value: "8", label: "Agustus" },
  { value: "9", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
];

const BULAN_NAMA = [
  "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

function formatCurrencyRupiah(val: number) {
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val || 0);
}

function getLastDayOfMonth(year: number, month: number) {
  const d = new Date(year, month, 0);
  return d.getDate();
}

export default function RekapBelanjaPage() {
  const [user, setUser] = useState<any>(null);

  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());

  const [upts, setUpts] = useState<any[]>([]);
  const [filterUpt, setFilterUpt] = useState("");

  const [data, setData] = useState<ReportResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const isSuperAdmin = user?.role === "superadmin" || user?.level === 1;

  useEffect(() => {
    const t = localStorage.getItem("tahunName");
    if (t) setTahun(parseInt(t));

    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setUser(d.user);
          if (d.user.kd_upt) {
            setFilterUpt(d.user.kd_upt);
          }
        }
      });

    fetch("/api/upt")
      .then((r) => r.json())
      .then((d) => setUpts(d.data || []));
  }, []);

  const loadReport = () => {
    const activeUpt = isSuperAdmin ? filterUpt : (user?.kd_upt || user?.unit || "");
    if (!activeUpt) {
      Swal.fire("Pilih Unit UPT", "Silakan pilih unit UPT terlebih dahulu", "warning");
      return;
    }

    setLoading(true);
    const query = new URLSearchParams({
      tahun: tahun.toString(),
      kd_upt: activeUpt,
      bulan: bulan.toString(),
    });

    fetch(`/api/pelaporan/rekap-belanja?${query.toString()}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setData(res);
        } else {
          Swal.fire("Gagal", res.error || "Gagal memuat Rekapitulasi Belanja", "error");
        }
      })
      .catch((err) => {
        console.error("Error load rekap-belanja:", err);
        Swal.fire("Error", "Terjadi kesalahan saat memuat data Rekapitulasi Belanja", "error");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user && (filterUpt || !isSuperAdmin)) {
      loadReport();
    }
  }, [user, bulan, tahun, filterUpt]);

  const handleCetak = () => {
    const activeUpt = isSuperAdmin ? filterUpt : (user?.kd_upt || user?.unit || "");
    if (!activeUpt) {
      Swal.fire("Pilih Unit UPT", "Silakan pilih unit UPT terlebih dahulu", "warning");
      return;
    }

    const query = new URLSearchParams({
      tahun: tahun.toString(),
      kd_upt: activeUpt,
      bulan: bulan.toString(),
    });

    window.open(`/dashboard/pelaporan/rekap-belanja/cetak?${query.toString()}`, "_blank");
  };

  const lastDay = getLastDayOfMonth(tahun, bulan);
  const tglTtdStr = `Sipirok, ${String(lastDay).padStart(2, "0")} ${BULAN_NAMA[bulan]} ${tahun}`;

  return (
    <div className="animate-fadein" style={{ paddingBottom: 40 }}>
      {/* Header Page */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>
            📑 Rekapitulasi Belanja (SPJ Belanja Fungsional)
          </h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>
            Laporan Pertanggungjawaban Bendahara Pengeluaran per Program, Kegiatan, Sub Kegiatan, dan Rekening — Tahun Anggaran {tahun}
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={loadReport}
            className="btn btn-primary"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600 }}
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Tampilkan Data
          </button>
          <button
            onClick={handleCetak}
            className="btn btn-secondary"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, background: "#059669", color: "#fff", border: "none" }}
          >
            <Printer size={15} /> Cetak Laporan
          </button>
        </div>
      </div>

      {/* Filter Card */}
      <div style={{ background: "#FFFFFF", padding: 20, borderRadius: 12, border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, borderBottom: "1px solid #F1F5F9", paddingBottom: 12 }}>
          <Filter size={18} color="#2563EB" />
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1E293B" }}>Parameter Laporan</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
          {isSuperAdmin && (
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
                Unit / UPT <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <Select
                options={upts.map((u) => ({ value: u.kd_upt || "", label: `${u.kd_upt ? `[${u.kd_upt}] ` : ""}${u.nm_upt}` }))}
                value={filterUpt ? { value: filterUpt, label: upts.find((u) => u.kd_upt === filterUpt)?.nm_upt || filterUpt } : null}
                onChange={(selected: any) => setFilterUpt(selected?.value || "")}
                placeholder="-- Pilih Unit UPT --"
                isClearable
                styles={{
                  control: (base) => ({ ...base, borderColor: "#CBD5E1", borderRadius: "0.5rem", minHeight: "40px", fontSize: "13px" }),
                  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                }}
                menuPortalTarget={typeof window !== "undefined" ? document.body : null}
              />
            </div>
          )}

          <div style={{ maxWidth: 260 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
              Periode Bulan
            </label>
            <Select
              options={BULAN_OPTIONS}
              value={BULAN_OPTIONS.find((o) => o.value === bulan.toString())}
              onChange={(selected: any) => setBulan(parseInt(selected?.value || "1"))}
              styles={{
                control: (base) => ({ ...base, borderColor: "#CBD5E1", borderRadius: "0.5rem", minHeight: "40px", fontSize: "13px" }),
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              }}
              menuPortalTarget={typeof window !== "undefined" ? document.body : null}
            />
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={{ background: "#FFFFFF", padding: 60, borderRadius: 12, border: "1px solid #E2E8F0", textAlign: "center" }}>
          <div className="loading-spinner" style={{ width: 36, height: 36, margin: "0 auto 16px" }} />
          <p style={{ fontSize: 14, color: "#64748B", fontWeight: 500 }}>Memuat Rekapitulasi SPJ Belanja Fungsional...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !data && (
        <div style={{ background: "#FFFFFF", padding: 60, borderRadius: 12, border: "1px solid #E2E8F0", textAlign: "center" }}>
          <FileText size={48} style={{ color: "#94A3B8", margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1E293B", marginBottom: 6 }}>Silakan Pilih Unit UPT</h3>
          <p style={{ fontSize: 13, color: "#64748B", maxWidth: 440, margin: "0 auto 20px" }}>
            Pilih Unit UPT untuk menampilkan dokumen Rekapitulasi SPJ Belanja Fungsional.
          </p>
        </div>
      )}

      {/* Data Display / Preview Table Exact Like Screenshot */}
      {!loading && data && (
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 8,
            border: "1px solid #CBD5E1",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            padding: "24px 28px",
            fontFamily: "Arial, sans-serif",
            color: "#000",
          }}
        >
          {/* Header Title */}
          <div style={{ textAlign: "center", marginBottom: 18 }}>
            <h2 style={{ fontSize: 14, fontWeight: "bold", margin: "0 0 2px 0", letterSpacing: "0.5px" }}>
              PEMERINTAH KABUPATEN TAPANULI SELATAN
            </h2>
            <h1 style={{ fontSize: 15, fontWeight: "bold", margin: "0 0 2px 0", letterSpacing: "0.5px" }}>
              LAPORAN PERTANGGUNGJAWABAN BENDAHARA PENGELUARAN
            </h1>
            <h3 style={{ fontSize: 14, fontWeight: "bold", margin: "0 0 2px 0", letterSpacing: "0.5px" }}>
              (SPJ BELANJA FUNGSIONAL)
            </h3>
          </div>

          {/* Metadata Parameters Table */}
          <div style={{ width: "100%", marginBottom: 14, fontSize: 11 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td style={{ width: 220, padding: "2px 0", verticalAlign: "top" }}>SKPD/UPT</td>
                  <td style={{ width: 15, padding: "2px 0", verticalAlign: "top" }}>:</td>
                  <td style={{ padding: "2px 0", verticalAlign: "top" }}>
                    {data.upt?.kd_upt ? `${data.upt?.kd_upt} - ${data.upt?.nm_upt}` : "1.02.5.02.0.00.02.00 - Puskesmas Batang Toru"}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "2px 0", verticalAlign: "top" }}>Pengguna/Kuasa Pengguna Anggaran</td>
                  <td style={{ padding: "2px 0", verticalAlign: "top" }}>:</td>
                  <td style={{ padding: "2px 0", verticalAlign: "top" }}>
                    {data.penandatanganKpa?.nama || "dr. SRI KHAIRUNNISA, MH, MKM"}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "2px 0", verticalAlign: "top" }}>Bendahara Pengeluaran</td>
                  <td style={{ padding: "2px 0", verticalAlign: "top" }}>:</td>
                  <td style={{ padding: "2px 0", verticalAlign: "top" }}>
                    {data.penandatanganBendahara?.nama || "SANLY MELISKA, S.K.M."}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "2px 0", verticalAlign: "top" }}>Tahun Anggaran</td>
                  <td style={{ padding: "2px 0", verticalAlign: "top" }}>:</td>
                  <td style={{ padding: "2px 0", verticalAlign: "top" }}>{tahun}</td>
                </tr>
                <tr>
                  <td style={{ padding: "2px 0", verticalAlign: "top" }}>Bulan</td>
                  <td style={{ padding: "2px 0", verticalAlign: "top" }}>:</td>
                  <td style={{ padding: "2px 0", verticalAlign: "top", textTransform: "uppercase" }}>{BULAN_NAMA[data.bulan]}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Table Data Exact Like Screenshot (17 Kolom) */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10, border: "1px solid #000" }}>
              <thead>
                <tr style={{ background: "#fff", textAlign: "center" }}>
                  <th rowSpan={2} style={{ border: "1px solid #000", padding: "6px 4px", width: 140, fontWeight: "bold" }}>
                    KODE<br />REKENING
                  </th>
                  <th rowSpan={2} style={{ border: "1px solid #000", padding: "6px 6px", minWidth: 240, fontWeight: "bold" }}>
                    URAIAN
                  </th>
                  <th rowSpan={2} style={{ border: "1px solid #000", padding: "6px 6px", width: 110, fontWeight: "bold" }}>
                    JUMLAH<br />ANGGARAN<br />(Rp)
                  </th>
                  <th colSpan={3} style={{ border: "1px solid #000", padding: "4px", fontWeight: "bold" }}>
                    APBD
                  </th>
                  <th colSpan={3} style={{ border: "1px solid #000", padding: "4px", fontWeight: "bold" }}>
                    BLUD
                  </th>
                  <th colSpan={3} style={{ border: "1px solid #000", padding: "4px", fontWeight: "bold" }}>
                    BOK
                  </th>
                  <th colSpan={3} style={{ border: "1px solid #000", padding: "4px", fontWeight: "bold" }}>
                    JKN
                  </th>
                  <th rowSpan={2} style={{ border: "1px solid #000", padding: "6px 6px", width: 120, fontWeight: "bold" }}>
                    TOTAL SPJ<br />(APBD+BLUD+BOK+JKN)<br />(Rp)
                  </th>
                  <th rowSpan={2} style={{ border: "1px solid #000", padding: "6px 6px", width: 110, fontWeight: "bold" }}>
                    SISA ANGGARAN<br />(Rp)
                  </th>
                </tr>
                <tr style={{ background: "#fff", textAlign: "center", fontSize: 9 }}>
                  {/* APBD */}
                  <th style={{ border: "1px solid #000", padding: "4px 2px", width: 85, fontWeight: "bold" }}>S/D. BULAN LALU</th>
                  <th style={{ border: "1px solid #000", padding: "4px 2px", width: 80, fontWeight: "bold" }}>BULAN INI</th>
                  <th style={{ border: "1px solid #000", padding: "4px 2px", width: 85, fontWeight: "bold" }}>S/D. BULAN INI</th>
                  {/* BLUD */}
                  <th style={{ border: "1px solid #000", padding: "4px 2px", width: 85, fontWeight: "bold" }}>S/D. BULAN LALU</th>
                  <th style={{ border: "1px solid #000", padding: "4px 2px", width: 80, fontWeight: "bold" }}>BULAN INI</th>
                  <th style={{ border: "1px solid #000", padding: "4px 2px", width: 85, fontWeight: "bold" }}>S/D. BULAN INI</th>
                  {/* BOK */}
                  <th style={{ border: "1px solid #000", padding: "4px 2px", width: 85, fontWeight: "bold" }}>S/D. BULAN LALU</th>
                  <th style={{ border: "1px solid #000", padding: "4px 2px", width: 80, fontWeight: "bold" }}>BULAN INI</th>
                  <th style={{ border: "1px solid #000", padding: "4px 2px", width: 85, fontWeight: "bold" }}>S/D. BULAN INI</th>
                  {/* JKN */}
                  <th style={{ border: "1px solid #000", padding: "4px 2px", width: 85, fontWeight: "bold" }}>S/D. BULAN LALU</th>
                  <th style={{ border: "1px solid #000", padding: "4px 2px", width: 80, fontWeight: "bold" }}>BULAN INI</th>
                  <th style={{ border: "1px solid #000", padding: "4px 2px", width: 85, fontWeight: "bold" }}>S/D. BULAN INI</th>
                </tr>
                <tr style={{ background: "#fff", textAlign: "center", fontSize: 9 }}>
                  <th style={{ border: "1px solid #000", padding: "2px" }}>1</th>
                  <th style={{ border: "1px solid #000", padding: "2px" }}>2</th>
                  <th style={{ border: "1px solid #000", padding: "2px" }}>3</th>
                  <th style={{ border: "1px solid #000", padding: "2px" }}>4</th>
                  <th style={{ border: "1px solid #000", padding: "2px" }}>5</th>
                  <th style={{ border: "1px solid #000", padding: "2px" }}>6</th>
                  <th style={{ border: "1px solid #000", padding: "2px" }}>7</th>
                  <th style={{ border: "1px solid #000", padding: "2px" }}>8</th>
                  <th style={{ border: "1px solid #000", padding: "2px" }}>9</th>
                  <th style={{ border: "1px solid #000", padding: "2px" }}>10</th>
                  <th style={{ border: "1px solid #000", padding: "2px" }}>11</th>
                  <th style={{ border: "1px solid #000", padding: "2px" }}>12</th>
                  <th style={{ border: "1px solid #000", padding: "2px" }}>13</th>
                  <th style={{ border: "1px solid #000", padding: "2px" }}>14</th>
                  <th style={{ border: "1px solid #000", padding: "2px" }}>15</th>
                  <th style={{ border: "1px solid #000", padding: "2px" }}>16 = 6+9+12+15</th>
                  <th style={{ border: "1px solid #000", padding: "2px" }}>17 = 3-16</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.length === 0 ? (
                  <tr>
                    <td colSpan={17} style={{ border: "1px solid #000", padding: "16px 8px", textAlign: "center", color: "#666", fontStyle: "italic" }}>
                      Belum ada data anggaran atau realisasi belanja pada periode ini.
                    </td>
                  </tr>
                ) : (
                  data.rows.map((row) => {
                    const isProg = row.level === "program";
                    const isGiat = row.level === "kegiatan";
                    const isSub = row.level === "sub_kegiatan";

                    let fontWeight = isProg || isGiat || isSub ? "bold" : "normal";

                    return (
                      <tr key={row.id} style={{ fontWeight }}>
                        <td style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "left", verticalAlign: "top" }}>
                          {row.kode}
                        </td>
                        <td style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "left", verticalAlign: "top" }}>
                          {row.uraian}
                        </td>
                        <td style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "right", verticalAlign: "top" }}>
                          {formatCurrencyRupiah(row.jumlahAnggaran)}
                        </td>
                        {/* APBD */}
                        <td style={{ border: "1px solid #000", padding: "4px 4px", textAlign: "right", verticalAlign: "top" }}>
                          {formatCurrencyRupiah(row.apbdLalu)}
                        </td>
                        <td style={{ border: "1px solid #000", padding: "4px 4px", textAlign: "right", verticalAlign: "top" }}>
                          {formatCurrencyRupiah(row.apbdIni)}
                        </td>
                        <td style={{ border: "1px solid #000", padding: "4px 4px", textAlign: "right", verticalAlign: "top" }}>
                          {formatCurrencyRupiah(row.apbdSdIni)}
                        </td>
                        {/* BLUD */}
                        <td style={{ border: "1px solid #000", padding: "4px 4px", textAlign: "right", verticalAlign: "top" }}>
                          {formatCurrencyRupiah(row.bludLalu)}
                        </td>
                        <td style={{ border: "1px solid #000", padding: "4px 4px", textAlign: "right", verticalAlign: "top" }}>
                          {formatCurrencyRupiah(row.bludIni)}
                        </td>
                        <td style={{ border: "1px solid #000", padding: "4px 4px", textAlign: "right", verticalAlign: "top" }}>
                          {formatCurrencyRupiah(row.bludSdIni)}
                        </td>
                        {/* BOK */}
                        <td style={{ border: "1px solid #000", padding: "4px 4px", textAlign: "right", verticalAlign: "top" }}>
                          {formatCurrencyRupiah(row.bokLalu)}
                        </td>
                        <td style={{ border: "1px solid #000", padding: "4px 4px", textAlign: "right", verticalAlign: "top" }}>
                          {formatCurrencyRupiah(row.bokIni)}
                        </td>
                        <td style={{ border: "1px solid #000", padding: "4px 4px", textAlign: "right", verticalAlign: "top" }}>
                          {formatCurrencyRupiah(row.bokSdIni)}
                        </td>
                        {/* JKN */}
                        <td style={{ border: "1px solid #000", padding: "4px 4px", textAlign: "right", verticalAlign: "top" }}>
                          {formatCurrencyRupiah(row.jknLalu)}
                        </td>
                        <td style={{ border: "1px solid #000", padding: "4px 4px", textAlign: "right", verticalAlign: "top" }}>
                          {formatCurrencyRupiah(row.jknIni)}
                        </td>
                        <td style={{ border: "1px solid #000", padding: "4px 4px", textAlign: "right", verticalAlign: "top" }}>
                          {formatCurrencyRupiah(row.jknSdIni)}
                        </td>
                        {/* Total SPJ & Sisa */}
                        <td style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "right", verticalAlign: "top" }}>
                          {formatCurrencyRupiah(row.totalSpj)}
                        </td>
                        <td style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "right", verticalAlign: "top" }}>
                          {formatCurrencyRupiah(row.sisaAnggaran)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr style={{ fontWeight: "bold", textAlign: "center", background: "#fff" }}>
                  <td colSpan={2} style={{ border: "1px solid #000", padding: "6px 8px" }}>
                    TOTAL
                  </td>
                  <td style={{ border: "1px solid #000", padding: "6px 8px", textAlign: "right" }}>
                    {formatCurrencyRupiah(data.summary.grandAnggaran)}
                  </td>
                  {/* APBD */}
                  <td style={{ border: "1px solid #000", padding: "6px 4px", textAlign: "right" }}>
                    {formatCurrencyRupiah(data.summary.grandApbdLalu)}
                  </td>
                  <td style={{ border: "1px solid #000", padding: "6px 4px", textAlign: "right" }}>
                    {formatCurrencyRupiah(data.summary.grandApbdIni)}
                  </td>
                  <td style={{ border: "1px solid #000", padding: "6px 4px", textAlign: "right" }}>
                    {formatCurrencyRupiah(data.summary.grandApbdSdIni)}
                  </td>
                  {/* BLUD */}
                  <td style={{ border: "1px solid #000", padding: "6px 4px", textAlign: "right" }}>
                    {formatCurrencyRupiah(data.summary.grandBludLalu)}
                  </td>
                  <td style={{ border: "1px solid #000", padding: "6px 4px", textAlign: "right" }}>
                    {formatCurrencyRupiah(data.summary.grandBludIni)}
                  </td>
                  <td style={{ border: "1px solid #000", padding: "6px 4px", textAlign: "right" }}>
                    {formatCurrencyRupiah(data.summary.grandBludSdIni)}
                  </td>
                  {/* BOK */}
                  <td style={{ border: "1px solid #000", padding: "6px 4px", textAlign: "right" }}>
                    {formatCurrencyRupiah(data.summary.grandBokLalu)}
                  </td>
                  <td style={{ border: "1px solid #000", padding: "6px 4px", textAlign: "right" }}>
                    {formatCurrencyRupiah(data.summary.grandBokIni)}
                  </td>
                  <td style={{ border: "1px solid #000", padding: "6px 4px", textAlign: "right" }}>
                    {formatCurrencyRupiah(data.summary.grandBokSdIni)}
                  </td>
                  {/* JKN */}
                  <td style={{ border: "1px solid #000", padding: "6px 4px", textAlign: "right" }}>
                    {formatCurrencyRupiah(data.summary.grandJknLalu)}
                  </td>
                  <td style={{ border: "1px solid #000", padding: "6px 4px", textAlign: "right" }}>
                    {formatCurrencyRupiah(data.summary.grandJknIni)}
                  </td>
                  <td style={{ border: "1px solid #000", padding: "6px 4px", textAlign: "right" }}>
                    {formatCurrencyRupiah(data.summary.grandJknSdIni)}
                  </td>
                  {/* Total & Sisa */}
                  <td style={{ border: "1px solid #000", padding: "6px 6px", textAlign: "right" }}>
                    {formatCurrencyRupiah(data.summary.grandTotalSpj)}
                  </td>
                  <td style={{ border: "1px solid #000", padding: "6px 6px", textAlign: "right" }}>
                    {formatCurrencyRupiah(data.summary.grandSisaAnggaran)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Footer Signature Layout */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              marginTop: 35,
              fontSize: 11,
              color: "#000",
            }}
          >
            {/* Kiri: Mengetahui KPA */}
            <div style={{ textAlign: "center" }}>
              <p style={{ margin: "0 0 4px 0" }}>Mengetahui,</p>
              <p style={{ fontWeight: "bold", textTransform: "uppercase", margin: 0 }}>
                {data.penandatanganKpa?.jabatan || "Pengguna/Kuasa Pengguna Anggaran"}
              </p>
              <div style={{ height: 65 }} />
              <p style={{ fontWeight: "bold", textDecoration: "underline", margin: "0 0 2px 0" }}>
                {data.penandatanganKpa?.nama || "dr. SRI KHAIRUNNISA, MH, MKM"}
              </p>
              <p style={{ margin: "0 0 2px 0" }}>
                {data.penandatanganKpa?.pangkat_golongan || "PEMBINA UTAMA MUDA/ IV.c"}
              </p>
              <p style={{ margin: 0 }}>
                NIP. {data.penandatanganKpa?.nip || "197112262002122008"}
              </p>
            </div>

            {/* Kanan: Bendahara Pengeluaran */}
            <div style={{ textAlign: "center" }}>
              <p style={{ margin: "0 0 4px 0" }}>{tglTtdStr}</p>
              <p style={{ fontWeight: "bold", textTransform: "uppercase", margin: 0 }}>
                {data.penandatanganBendahara?.jabatan || "Bendahara Pengeluaran"}
              </p>
              <div style={{ height: 65 }} />
              <p style={{ fontWeight: "bold", textDecoration: "underline", margin: "0 0 2px 0" }}>
                {data.penandatanganBendahara?.nama || "SANLY MELISKA, S.K.M."}
              </p>
              <p style={{ margin: "0 0 2px 0" }}>
                {data.penandatanganBendahara?.pangkat_golongan || "PENATA MUDA TK. 1"}
              </p>
              <p style={{ margin: 0 }}>
                NIP. {data.penandatanganBendahara?.nip || "198608262006042001"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
