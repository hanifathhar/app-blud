"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Printer, RefreshCw, FileText, Filter } from "lucide-react";
import Select from "react-select";
import Swal from "sweetalert2";

interface TaxItem {
  id: number;
  no_urut: number;
  tgl_transaksi: string;
  no_transaksi: string;
  ref: string;
  rekening_potongan: string;
  uraian: string;
  pemotongan: number;
  penyetoran: number;
  saldo: number;
}

interface ReportData {
  bulan: number;
  tahun: number;
  kd_upt: string;
  upt: any;
  penandatanganKpa: any;
  penandatanganBendahara: any;
  saldoBulanLalu: number;
  items: TaxItem[];
  summary: {
    totalPemotonganBulanIni: number;
    totalPenyetoranBulanIni: number;
    pemotonganSdPeriodeLalu: number;
    penyetoranSdPeriodeLalu: number;
    totalPemotonganSdPeriodeIni: number;
    totalPenyetoranSdPeriodeIni: number;
    saldoAkhir: number;
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

function formatDateIndo(dateStr?: string | Date | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function getLastDayOfMonth(year: number, month: number) {
  const d = new Date(year, month, 0);
  return d.getDate();
}

export default function BukuPembantuPajakPage() {
  const [user, setUser] = useState<any>(null);

  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());

  const [upts, setUpts] = useState<any[]>([]);
  const [filterUpt, setFilterUpt] = useState("");

  const [data, setData] = useState<ReportData | null>(null);
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
      bulan: bulan.toString(),
      tahun: tahun.toString(),
      kd_upt: activeUpt,
    });

    fetch(`/api/pelaporan/bku-pajak?${query.toString()}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setData(res);
        } else {
          Swal.fire("Gagal", res.error || "Gagal memuat laporan Buku Pembantu Pajak", "error");
        }
      })
      .catch((err) => {
        console.error("Error load tax report:", err);
        Swal.fire("Error", "Terjadi kesalahan saat memuat data laporan", "error");
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
      bulan: bulan.toString(),
      tahun: tahun.toString(),
      kd_upt: activeUpt,
    });

    window.open(`/dashboard/pelaporan/bku-pajak/cetak?${query.toString()}`, "_blank");
  };

  const lastDay = getLastDayOfMonth(tahun, bulan);
  const tglTtdStr = `Sipirok, ${String(lastDay).padStart(2, "0")} ${BULAN_NAMA[bulan]} ${tahun}`;

  return (
    <div className="animate-fadein" style={{ paddingBottom: 40 }}>
      {/* Header Page */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>
            📑 Buku Pembantu Pajak
          </h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>
            Laporan pertanggungjawaban pemotongan dan penyetoran pajak — Tahun Anggaran {tahun}
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
          <p style={{ fontSize: 14, color: "#64748B", fontWeight: 500 }}>Memuat Buku Pembantu Pajak...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !data && (
        <div style={{ background: "#FFFFFF", padding: 60, borderRadius: 12, border: "1px solid #E2E8F0", textAlign: "center" }}>
          <FileText size={48} style={{ color: "#94A3B8", margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1E293B", marginBottom: 6 }}>Silakan Pilih Parameter</h3>
          <p style={{ fontSize: 13, color: "#64748B", maxWidth: 440, margin: "0 auto 20px" }}>
            Pilih Unit UPT dan Bulan untuk menampilkan laporan Buku Pembantu Pajak.
          </p>
        </div>
      )}

      {/* Data Display / Preview Table */}
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
          {/* Header Title with Logo */}
          <div style={{ textAlign: "center", marginBottom: 18 }}>
            <h2 style={{ fontSize: 14, fontWeight: "bold", margin: "0 0 2px 0", letterSpacing: "0.5px" }}>
              PEMERINTAH KABUPATEN TAPANULI SELATAN
            </h2>
            <h1 style={{ fontSize: 15, fontWeight: "bold", margin: "0 0 2px 0", letterSpacing: "0.5px" }}>
              BUKU PEMBANTU PAJAK
            </h1>
            <h3 style={{ fontSize: 14, fontWeight: "bold", margin: 0, letterSpacing: "0.5px" }}>
              BENDAHARA PENGELUARAN
            </h3>
            <p style={{ fontSize: 12, margin: "4px 0 0 0" }}>
              PERIODE {BULAN_NAMA[data.bulan].toUpperCase()} {tahun}
            </p>
          </div>

          {/* Metadata Parameters Table */}
          <div style={{ width: "100%", marginBottom: 14, fontSize: 12 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td style={{ padding: "2px 0", verticalAlign: "top" }}>Unit/UPT</td>
                  <td style={{ padding: "2px 0", verticalAlign: "top" }}>:</td>
                  <td style={{ padding: "2px 0", verticalAlign: "top", fontWeight: "bold" }}>
                    {data.upt?.kd_upt ? `${data.upt?.kd_upt} - ${data.upt?.nm_upt}` : "Dinas Kesehatan Daerah"}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "2px 0", verticalAlign: "top" }}>NPWP</td>
                  <td style={{ padding: "2px 0", verticalAlign: "top" }}>:</td>
                  <td style={{ padding: "2px 0", verticalAlign: "top" }}>-</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Table Data Lengkap dengan No Transaksi, Ref, Rekening Potongan */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, border: "1px solid #000" }}>
              <thead>
                <tr style={{ background: "#fff", textAlign: "center" }}>
                  <th style={{ border: "1px solid #000", padding: "6px 6px", width: 40, fontWeight: "bold" }}>
                    NO
                  </th>
                  <th style={{ border: "1px solid #000", padding: "6px 6px", width: 80, fontWeight: "bold" }}>
                    TANGGAL
                  </th>
                  <th style={{ border: "1px solid #000", padding: "6px 6px", width: 110, fontWeight: "bold" }}>
                    NO. TRANSAKSI
                  </th>
                  <th style={{ border: "1px solid #000", padding: "6px 6px", width: 110, fontWeight: "bold" }}>
                    REF.<br /><span style={{ fontSize: 9, fontWeight: "normal" }}>(ID Billing / NTPN)</span>
                  </th>
                  <th style={{ border: "1px solid #000", padding: "6px 6px", width: 130, fontWeight: "bold" }}>
                    REKENING POTONGAN
                  </th>
                  <th style={{ border: "1px solid #000", padding: "6px 8px", fontWeight: "bold" }}>
                    URAIAN
                  </th>
                  <th style={{ border: "1px solid #000", padding: "6px 6px", width: 105, fontWeight: "bold" }}>
                    PEMOTONGAN<br />(Rp)
                  </th>
                  <th style={{ border: "1px solid #000", padding: "6px 6px", width: 105, fontWeight: "bold" }}>
                    PENYETORAN<br />(Rp)
                  </th>
                  <th style={{ border: "1px solid #000", padding: "6px 6px", width: 115, fontWeight: "bold" }}>
                    SALDO<br />(Rp)
                  </th>
                </tr>
                <tr style={{ background: "#fff", textAlign: "center", fontSize: 10 }}>
                  <th style={{ border: "1px solid #000", padding: "3px 4px", fontWeight: "bold" }}>1</th>
                  <th style={{ border: "1px solid #000", padding: "3px 4px", fontWeight: "bold" }}>2</th>
                  <th style={{ border: "1px solid #000", padding: "3px 4px", fontWeight: "bold" }}>3</th>
                  <th style={{ border: "1px solid #000", padding: "3px 4px", fontWeight: "bold" }}>4</th>
                  <th style={{ border: "1px solid #000", padding: "3px 4px", fontWeight: "bold" }}>5</th>
                  <th style={{ border: "1px solid #000", padding: "3px 4px", fontWeight: "bold" }}>6</th>
                  <th style={{ border: "1px solid #000", padding: "3px 4px", fontWeight: "bold" }}>7</th>
                  <th style={{ border: "1px solid #000", padding: "3px 4px", fontWeight: "bold" }}>8</th>
                  <th style={{ border: "1px solid #000", padding: "3px 4px", fontWeight: "bold" }}>9</th>
                </tr>
              </thead>
              <tbody>
                {/* Baris Saldo Bulan Lalu */}
                <tr>
                  <td style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "center" }}></td>
                  <td style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "center" }}></td>
                  <td style={{ border: "1px solid #000", padding: "4px 6px" }}></td>
                  <td style={{ border: "1px solid #000", padding: "4px 6px" }}></td>
                  <td style={{ border: "1px solid #000", padding: "4px 6px" }}></td>
                  <td style={{ border: "1px solid #000", padding: "4px 6px", fontWeight: "bold" }}>
                    SALDO BULAN LALU
                  </td>
                  <td style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "right" }}></td>
                  <td style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "right" }}></td>
                  <td style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "right", fontWeight: "bold" }}>
                    {formatCurrencyRupiah(data.saldoBulanLalu)}
                  </td>
                </tr>

                {/* Items Transaksi */}
                {data.items.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ border: "1px solid #000", padding: "20px 8px", textAlign: "center", color: "#666", fontStyle: "italic" }}>
                      Tidak ada transaksi pemotongan maupun penyetoran pajak pada bulan ini.
                    </td>
                  </tr>
                ) : (
                  data.items.map((item) => (
                    <tr key={item.id}>
                      <td style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "center" }}>
                        {item.no_urut}
                      </td>
                      <td style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "center" }}>
                        {formatDateIndo(item.tgl_transaksi)}
                      </td>
                      <td style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "center", fontSize: 10 }}>
                        {item.no_transaksi}
                      </td>
                      <td style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "center", fontSize: 10, fontFamily: "monospace" }}>
                        {item.ref}
                      </td>
                      <td style={{ border: "1px solid #000", padding: "4px 6px", fontSize: 10 }}>
                        {item.rekening_potongan}
                      </td>
                      <td style={{ border: "1px solid #000", padding: "4px 6px" }}>
                        {item.uraian}
                      </td>
                      <td style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "right" }}>
                        {item.pemotongan > 0 ? formatCurrencyRupiah(item.pemotongan) : "0,00"}
                      </td>
                      <td style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "right" }}>
                        {item.penyetoran > 0 ? formatCurrencyRupiah(item.penyetoran) : "0,00"}
                      </td>
                      <td style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "right", fontWeight: "bold" }}>
                        {formatCurrencyRupiah(item.saldo)}
                      </td>
                    </tr>
                  ))
                )}

                {/* Baris Total Bulan Ini */}
                <tr style={{ fontWeight: "bold", background: "#fdfdfd" }}>
                  <td colSpan={6} style={{ border: "1px solid #000", padding: "5px 6px", textAlign: "right" }}>
                    TOTAL BULAN INI
                  </td>
                  <td style={{ border: "1px solid #000", padding: "5px 6px", textAlign: "right" }}>
                    {formatCurrencyRupiah(data.summary.totalPemotonganBulanIni)}
                  </td>
                  <td style={{ border: "1px solid #000", padding: "5px 6px", textAlign: "right" }}>
                    {formatCurrencyRupiah(data.summary.totalPenyetoranBulanIni)}
                  </td>
                  <td style={{ border: "1px solid #000", padding: "5px 6px", textAlign: "right" }}>
                    {formatCurrencyRupiah(data.summary.saldoAkhir)}
                  </td>
                </tr>

                {/* Baris Total s/d Bulan Lalu */}
                <tr style={{ fontWeight: "bold", background: "#fdfdfd" }}>
                  <td colSpan={6} style={{ border: "1px solid #000", padding: "5px 6px", textAlign: "right" }}>
                    TOTAL S/D BULAN LALU
                  </td>
                  <td style={{ border: "1px solid #000", padding: "5px 6px", textAlign: "right" }}>
                    {formatCurrencyRupiah(data.summary.pemotonganSdPeriodeLalu)}
                  </td>
                  <td style={{ border: "1px solid #000", padding: "5px 6px", textAlign: "right" }}>
                    {formatCurrencyRupiah(data.summary.penyetoranSdPeriodeLalu)}
                  </td>
                  <td style={{ border: "1px solid #000", padding: "5px 6px", textAlign: "right" }}>
                    {formatCurrencyRupiah(data.saldoBulanLalu)}
                  </td>
                </tr>

                {/* Baris Total s/d Bulan Ini */}
                <tr style={{ fontWeight: "bold", background: "#f5f5f5" }}>
                  <td colSpan={6} style={{ border: "1px solid #000", padding: "5px 6px", textAlign: "right" }}>
                    TOTAL S/D BULAN INI
                  </td>
                  <td style={{ border: "1px solid #000", padding: "5px 6px", textAlign: "right" }}>
                    {formatCurrencyRupiah(data.summary.totalPemotonganSdPeriodeIni)}
                  </td>
                  <td style={{ border: "1px solid #000", padding: "5px 6px", textAlign: "right" }}>
                    {formatCurrencyRupiah(data.summary.totalPenyetoranSdPeriodeIni)}
                  </td>
                  <td style={{ border: "1px solid #000", padding: "5px 6px", textAlign: "right" }}>
                    {formatCurrencyRupiah(data.summary.saldoAkhir)}
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
