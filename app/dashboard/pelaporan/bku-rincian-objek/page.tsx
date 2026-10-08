"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Printer, RefreshCw, FileText, Search, Filter } from "lucide-react";
import Select from "react-select";
import Swal from "sweetalert2";

interface OptionType {
  value: string;
  label: string;
}

interface BkuRincianItem {
  id: number;
  no_bukti: string;
  tgl_transaksi: string;
  uraian: string;
  ls: number;
  up_gu_tu: number;
  total: number;
}

interface ReportData {
  bulan: number;
  tahun: number;
  kd_upt: string;
  kd_sub_kegiatan: string;
  formattedSubKegiatanKode: string;
  kd_rek6: string;
  upt: any;
  infoSubGiat: any;
  infoRek6: any;
  anggaranApbd: number;
  anggaranPapbd: number;
  penandatanganKpa: any;
  penandatanganBendahara: any;
  items: BkuRincianItem[];
  summary: {
    totalLsBulanIni: number;
    totalUpGuTuBulanIni: number;
    totalBulanIni: number;

    totalLsLalu: number;
    totalUpGuTuLalu: number;
    totalSdPeriodeLalu: number;

    totalSdPeriodeIniLs: number;
    totalSdPeriodeIniUpGuTu: number;
    totalSdPeriodeIni: number;

    sisaAnggaran: number;
  };
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

export default function BukuPembantuRincianObjekPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());

  const [upts, setUpts] = useState<any[]>([]);
  const [filterUpt, setFilterUpt] = useState("");

  const [subKegiatanOptions, setSubKegiatanOptions] = useState<OptionType[]>([]);
  const [selectedSubKegiatan, setSelectedSubKegiatan] = useState<string>("");

  const [rekeningOptions, setRekeningOptions] = useState<OptionType[]>([]);
  const [selectedRekening, setSelectedRekening] = useState<string>("");

  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(false);

  const isSuperAdmin = user?.role === "superadmin" || user?.level === 1;

  // 1. Initial Load (Auth, UPTs, Tahun)
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

  // 2. Fetch Options (Sub Kegiatan & Rekening) saat UPT / Tahun berubah
  useEffect(() => {
    const activeUpt = isSuperAdmin ? filterUpt : (user?.kd_upt || user?.unit || "");
    if (!activeUpt && isSuperAdmin) {
      setSubKegiatanOptions([]);
      setRekeningOptions([]);
      return;
    }

    setOptionsLoading(true);
    const query = new URLSearchParams({
      tahun: tahun.toString(),
      ...(activeUpt ? { kd_upt: activeUpt } : {}),
      ...(selectedSubKegiatan ? { kd_sub_kegiatan: selectedSubKegiatan } : {}),
    });

    fetch(`/api/pelaporan/bku-rincian-objek/options?${query.toString()}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          const subOpts = (res.subKegiatanList || []).map((s: any) => ({
            value: s.kd_sub_kegiatan,
            label: `${s.kd_sub_kegiatan} - ${s.nm_sub_kegiatan}`,
          }));
          setSubKegiatanOptions(subOpts);

          const rekOpts = (res.rekeningList || []).map((r: any) => ({
            value: r.kd_rek6,
            label: `${r.kd_rek6} - ${r.nm_rek6}`,
          }));
          setRekeningOptions(rekOpts);
        }
      })
      .catch((err) => console.error("Error load options:", err))
      .finally(() => setOptionsLoading(false));
  }, [user, filterUpt, tahun, selectedSubKegiatan]);

  // 3. Load Data Laporan
  const loadReport = () => {
    const activeUpt = isSuperAdmin ? filterUpt : (user?.kd_upt || user?.unit || "");
    if (!activeUpt) {
      Swal.fire("Pilih Unit UPT", "Silakan pilih unit UPT terlebih dahulu", "warning");
      return;
    }

    if (!selectedSubKegiatan) {
      Swal.fire("Pilih Sub Kegiatan", "Silakan pilih Sub Kegiatan terlebih dahulu", "warning");
      return;
    }

    if (!selectedRekening) {
      Swal.fire("Pilih Rekening Belanja", "Silakan pilih Rekening Belanja terlebih dahulu", "warning");
      return;
    }

    setLoading(true);
    const query = new URLSearchParams({
      bulan: bulan.toString(),
      tahun: tahun.toString(),
      kd_upt: activeUpt,
      kd_sub_kegiatan: selectedSubKegiatan,
      kd_rek6: selectedRekening,
    });

    fetch(`/api/pelaporan/bku-rincian-objek?${query.toString()}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setData(res);
        } else {
          Swal.fire("Gagal", res.error || "Gagal memuat laporan", "error");
        }
      })
      .catch((err) => {
        console.error("Error load report:", err);
        Swal.fire("Error", "Terjadi kesalahan saat memuat data laporan", "error");
      })
      .finally(() => setLoading(false));
  };

  const handleCetak = () => {
    const activeUpt = isSuperAdmin ? filterUpt : (user?.kd_upt || user?.unit || "");
    if (!activeUpt) {
      Swal.fire("Pilih Unit UPT", "Silakan pilih unit UPT terlebih dahulu", "warning");
      return;
    }
    if (!selectedSubKegiatan) {
      Swal.fire("Pilih Sub Kegiatan", "Silakan pilih Sub Kegiatan terlebih dahulu", "warning");
      return;
    }
    if (!selectedRekening) {
      Swal.fire("Pilih Rekening", "Silakan pilih Rekening Belanja terlebih dahulu", "warning");
      return;
    }

    const query = new URLSearchParams({
      bulan: bulan.toString(),
      tahun: tahun.toString(),
      kd_upt: activeUpt,
      kd_sub_kegiatan: selectedSubKegiatan,
      kd_rek6: selectedRekening,
    });

    window.open(`/dashboard/pelaporan/bku-rincian-objek/cetak?${query.toString()}`, "_blank");
  };

  const lastDay = getLastDayOfMonth(tahun, bulan);
  const tglTtdStr = `Sipirok, ${String(lastDay).padStart(2, "0")} ${BULAN_NAMA[bulan]} ${tahun}`;

  return (
    <div className="animate-fadein" style={{ paddingBottom: 40 }}>
      {/* Header Page */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>
            📑 Buku Pembantu Rincian Objek Belanja
          </h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>
            Laporan rincian realisasi pengeluaran per sub kegiatan dan rekening belanja — Tahun Anggaran {tahun}
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
          {/* Unit / UPT Filter (For Superadmin) */}
          {isSuperAdmin && (
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
                Unit / UPT <span style={{ color: "#EF4444" }}>*</span>
              </label>
              <Select
                options={upts.map((u) => ({ value: u.kd_upt || "", label: `${u.kd_upt ? `[${u.kd_upt}] ` : ""}${u.nm_upt}` }))}
                value={filterUpt ? { value: filterUpt, label: upts.find((u) => u.kd_upt === filterUpt)?.nm_upt || filterUpt } : null}
                onChange={(selected: any) => {
                  setFilterUpt(selected?.value || "");
                  setSelectedSubKegiatan("");
                  setSelectedRekening("");
                }}
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

          {/* Sub Kegiatan Filter */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
              Sub Kegiatan <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <Select
              options={subKegiatanOptions}
              value={selectedSubKegiatan ? subKegiatanOptions.find((o) => o.value === selectedSubKegiatan) : null}
              onChange={(selected: any) => {
                setSelectedSubKegiatan(selected?.value || "");
                setSelectedRekening("");
              }}
              placeholder="-- Pilih Sub Kegiatan --"
              isLoading={optionsLoading}
              isClearable
              styles={{
                control: (base) => ({ ...base, borderColor: "#CBD5E1", borderRadius: "0.5rem", minHeight: "40px", fontSize: "13px" }),
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              }}
              menuPortalTarget={typeof window !== "undefined" ? document.body : null}
            />
          </div>

          {/* Rekening Belanja Filter */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
              Rekening Belanja <span style={{ color: "#EF4444" }}>*</span>
            </label>
            <Select
              options={rekeningOptions}
              value={selectedRekening ? rekeningOptions.find((o) => o.value === selectedRekening) : null}
              onChange={(selected: any) => setSelectedRekening(selected?.value || "")}
              placeholder="-- Pilih Rekening Belanja --"
              isLoading={optionsLoading}
              isClearable
              styles={{
                control: (base) => ({ ...base, borderColor: "#CBD5E1", borderRadius: "0.5rem", minHeight: "40px", fontSize: "13px" }),
                menuPortal: (base) => ({ ...base, zIndex: 9999 }),
              }}
              menuPortalTarget={typeof window !== "undefined" ? document.body : null}
            />
          </div>

          {/* Bulan Filter */}
          <div style={{ maxWidth: 220 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6 }}>
              Bulan Transaksi <span style={{ color: "#EF4444" }}>*</span>
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
          <p style={{ fontSize: 14, color: "#64748B", fontWeight: 500 }}>Memuat Buku Pembantu Rincian Objek...</p>
        </div>
      )}

      {/* Empty / Initial State */}
      {!loading && !data && (
        <div style={{ background: "#FFFFFF", padding: 60, borderRadius: 12, border: "1px solid #E2E8F0", textAlign: "center" }}>
          <FileText size={48} style={{ color: "#94A3B8", margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1E293B", marginBottom: 6 }}>Silakan Pilih Parameter</h3>
          <p style={{ fontSize: 13, color: "#64748B", maxWidth: 440, margin: "0 auto 20px" }}>
            Pilih Sub Kegiatan, Rekening Belanja, dan Bulan untuk menampilkan laporan Buku Pembantu Rincian Objek Belanja.
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
          {/* Header Title with Center Logo */}
          <div style={{ textAlign: "center", marginBottom: 18 }}>
            <h2 style={{ fontSize: 14, fontWeight: "bold", margin: "0 0 2px 0", letterSpacing: "0.5px" }}>
              PEMERINTAH KABUPATEN TAPANULI SELATAN
            </h2>
            <h1 style={{ fontSize: 15, fontWeight: "bold", margin: "0 0 2px 0", letterSpacing: "0.5px" }}>
              BUKU PEMBANTU RINCIAN OBJEK BELANJA
            </h1>
            <h3 style={{ fontSize: 14, fontWeight: "bold", margin: 0, letterSpacing: "0.5px" }}>
              TAHUN ANGGARAN {tahun}
            </h3>
          </div>

          {/* Metadata Parameters Table */}
          <div style={{ width: "100%", marginBottom: 14, fontSize: 12 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td style={{ padding: "2px 0", verticalAlign: "top" }}>Unit/UPT</td>
                  <td style={{ padding: "2px 0", verticalAlign: "top" }}>:</td>
                  <td style={{ padding: "2px 0", verticalAlign: "top" }}>
                    {data.upt?.kd_upt ? `1.02.5.02.0.00.02.00 - ${data.upt?.nm_upt}` : "1.02.5.02.0.00.02.00 - Dinas Kesehatan Daerah"}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "2px 0", verticalAlign: "top" }}>Kegiatan</td>
                  <td style={{ padding: "2px 0", verticalAlign: "top" }}>:</td>
                  <td style={{ padding: "2px 0", verticalAlign: "top" }}>
                    {data.formattedSubKegiatanKode || data.kd_sub_kegiatan} - {data.infoSubGiat?.nm_sub_kegiatan || "Koordinasi dan Penyusunan Laporan Keuangan Bulanan/ Triwulanan/ Semesteran SKPD"}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "2px 0", verticalAlign: "top" }}>Rekening</td>
                  <td style={{ padding: "2px 0", verticalAlign: "top" }}>:</td>
                  <td style={{ padding: "2px 0", verticalAlign: "top" }}>
                    {data.infoRek6?.kd_rek6 || data.kd_rek6} - {data.infoRek6?.nm_rek6 || "Belanja Makanan dan Minuman Rapat"}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "2px 0", verticalAlign: "top" }}>Periode</td>
                  <td style={{ padding: "2px 0", verticalAlign: "top" }}>:</td>
                  <td style={{ padding: "2px 0", verticalAlign: "top" }}>{BULAN_NAMA[data.bulan]}</td>
                </tr>
                <tr>
                  <td style={{ padding: "2px 0", verticalAlign: "top" }}>Anggaran APBD</td>
                  <td style={{ padding: "2px 0", verticalAlign: "top" }}>:</td>
                  <td style={{ padding: "2px 0", verticalAlign: "top" }}>Rp. {formatCurrencyRupiah(data.anggaranApbd)}</td>
                </tr>
                <tr>
                  <td style={{ padding: "2px 0", verticalAlign: "top" }}>Anggaran PAPBD</td>
                  <td style={{ padding: "2px 0", verticalAlign: "top" }}>:</td>
                  <td style={{ padding: "2px 0", verticalAlign: "top" }}>Rp. {formatCurrencyRupiah(data.anggaranPapbd)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Table Data Exact Like Image */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, border: "1px solid #000" }}>
              <thead>
                <tr style={{ background: "#fff", textAlign: "center" }}>
                  <th style={{ border: "1px solid #000", padding: "6px 8px", width: 110, fontWeight: "bold" }}>
                    Nomor<br />BKU
                  </th>
                  <th style={{ border: "1px solid #000", padding: "6px 8px", width: 110, fontWeight: "bold" }}>
                    Tanggal
                  </th>
                  <th style={{ border: "1px solid #000", padding: "6px 8px", fontWeight: "bold" }}>
                    Uraian
                  </th>
                  <th style={{ border: "1px solid #000", padding: "6px 8px", width: 140, fontWeight: "bold" }}>
                    Jumlah
                  </th>
                </tr>
                <tr style={{ background: "#fff", textAlign: "center", fontSize: 10 }}>
                  <th style={{ border: "1px solid #000", padding: "3px 4px", fontWeight: "bold" }}>1</th>
                  <th style={{ border: "1px solid #000", padding: "3px 4px", fontWeight: "bold" }}>2</th>
                  <th style={{ border: "1px solid #000", padding: "3px 4px", fontWeight: "bold" }}>3</th>
                  <th style={{ border: "1px solid #000", padding: "3px 4px", fontWeight: "bold" }}>6=4+5</th>
                </tr>
              </thead>
              <tbody>
                {data.items.length === 0 ? (
                  <tr>
                    <td style={{ border: "1px solid #000", padding: "5px 8px", textAlign: "center", height: 28 }}></td>
                    <td style={{ border: "1px solid #000", padding: "5px 8px", textAlign: "center" }}></td>
                    <td style={{ border: "1px solid #000", padding: "5px 8px" }}></td>
                    <td style={{ border: "1px solid #000", padding: "5px 8px", textAlign: "right" }}></td>
                  </tr>
                ) : (
                  data.items.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td style={{ border: "1px solid #000", padding: "4px 8px", textAlign: "center" }}>
                        {item.no_bukti}
                      </td>
                      <td style={{ border: "1px solid #000", padding: "4px 8px", textAlign: "center" }}>
                        {formatDateIndo(item.tgl_transaksi)}
                      </td>
                      <td style={{ border: "1px solid #000", padding: "4px 8px" }}>
                        {item.uraian}
                      </td>
                      <td style={{ border: "1px solid #000", padding: "4px 8px", textAlign: "right" }}>
                        {formatCurrencyRupiah(item.total)}
                      </td>
                    </tr>
                  ))
                )}

                {/* Baris Jumlah */}
                <tr style={{ fontWeight: "bold", fontStyle: "italic" }}>
                  <td colSpan={3} style={{ border: "1px solid #000", padding: "4px 8px" }}>
                    Jumlah
                  </td>
                  <td style={{ border: "1px solid #000", padding: "4px 8px", textAlign: "right" }}>
                    {data.summary.totalBulanIni > 0 ? formatCurrencyRupiah(data.summary.totalBulanIni) : "0"}
                  </td>
                </tr>

                {/* Baris Jumlah s/d periode lalu */}
                <tr style={{ fontWeight: "bold", fontStyle: "italic" }}>
                  <td colSpan={3} style={{ border: "1px solid #000", padding: "4px 8px" }}>
                    Jumlah s/d periode lalu
                  </td>
                  <td style={{ border: "1px solid #000", padding: "4px 8px", textAlign: "right" }}>
                    {data.summary.totalSdPeriodeLalu > 0 ? formatCurrencyRupiah(data.summary.totalSdPeriodeLalu) : "0"}
                  </td>
                </tr>

                {/* Baris Jumlah s/d periode ini */}
                <tr style={{ fontWeight: "bold", fontStyle: "italic" }}>
                  <td colSpan={3} style={{ border: "1px solid #000", padding: "4px 8px" }}>
                    Jumlah s/d periode ini
                  </td>
                  <td style={{ border: "1px solid #000", padding: "4px 8px", textAlign: "right" }}>
                    {data.summary.totalSdPeriodeIni > 0 ? formatCurrencyRupiah(data.summary.totalSdPeriodeIni) : "0"}
                  </td>
                </tr>

                {/* Baris Sisa Anggaran */}
                <tr style={{ fontWeight: "bold", fontStyle: "italic" }}>
                  <td colSpan={3} style={{ border: "1px solid #000", padding: "4px 8px" }}>
                    Sisa Anggaran
                  </td>
                  <td style={{ border: "1px solid #000", padding: "4px 8px", textAlign: "right" }}>
                    {formatCurrencyRupiah(data.summary.sisaAnggaran)}
                  </td>
                </tr>
              </tbody>
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
                {data.penandatanganKpa?.jabatan || "KEPALA DINAS KESEHATAN DAERAH"}
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
                {data.penandatanganBendahara?.jabatan || "BENDAHARA PENGELUARAN"}
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
