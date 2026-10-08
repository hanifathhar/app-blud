"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Printer, RefreshCw, FileText, Filter, CheckCircle2 } from "lucide-react";
import Select from "react-select";
import Swal from "sweetalert2";

interface RegisterSpjItem {
  id: number;
  no_urut: number;
  tgl_spj: string;
  no_spj: string;
  uraian: string;
  sub_kegiatan?: string;
  rekening_belanja?: string;
  jenis_spj: string;
  jumlah_belanja: number;
  status: string;
  disahkan_oleh: string;
  tgl_disahkan: string;
  sumdan: string;
}

interface ReportData {
  bulan: number;
  tahun: number;
  kd_upt: string;
  upt: any;
  penandatanganKpa: any;
  penandatanganBendahara: any;
  items: RegisterSpjItem[];
  summary: {
    totalJumlahSpj: number;
    totalDokumen: number;
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

export default function RegisterSpjPage() {
  const [user, setUser] = useState<any>(null);

  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth() + 1); // 1-12
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
      tahun: tahun.toString(),
      kd_upt: activeUpt,
      bulan: bulan.toString(),
    });

    fetch(`/api/pelaporan/reg-spj?${query.toString()}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setData(res);
        } else {
          Swal.fire("Gagal", res.error || "Gagal memuat Register SPJ", "error");
        }
      })
      .catch((err) => {
        console.error("Error load reg-spj:", err);
        Swal.fire("Error", "Terjadi kesalahan saat memuat data Register SPJ", "error");
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

    window.open(`/dashboard/pelaporan/reg-spj/cetak?${query.toString()}`, "_blank");
  };

  return (
    <div className="animate-fadein" style={{ paddingBottom: 40 }}>
      {/* Header Page */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>
            📑 Register SPJ Bendahara Pengeluaran
          </h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>
            Register seluruh bukti transaksi pengeluaran belanja (Permendagri No. 77 Tahun 2020) — Tahun Anggaran {tahun}
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
            <Printer size={15} /> Cetak Register SPJ
          </button>
        </div>
      </div>

      {/* Filter Card */}
      <div style={{ background: "#FFFFFF", padding: 20, borderRadius: 12, border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, borderBottom: "1px solid #F1F5F9", paddingBottom: 12 }}>
          <Filter size={18} color="#2563EB" />
          <span style={{ fontSize: 14, fontWeight: 700, color: "#1E293B" }}>Parameter Register</span>
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
              onChange={(selected: any) => setBulan(parseInt(selected?.value || "0"))}
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
          <p style={{ fontSize: 14, color: "#64748B", fontWeight: 500 }}>Memuat Register SPJ...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !data && (
        <div style={{ background: "#FFFFFF", padding: 60, borderRadius: 12, border: "1px solid #E2E8F0", textAlign: "center" }}>
          <FileText size={48} style={{ color: "#94A3B8", margin: "0 auto 16px" }} />
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1E293B", marginBottom: 6 }}>Silakan Pilih Unit UPT</h3>
          <p style={{ fontSize: 13, color: "#64748B", maxWidth: 440, margin: "0 auto 20px" }}>
            Pilih Unit UPT untuk menampilkan dokumen Register SPJ Bendahara Pengeluaran.
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
          {/* Header Title */}
          <div style={{ textAlign: "center", marginBottom: 18 }}>
            <h2 style={{ fontSize: 14, fontWeight: "bold", margin: "0 0 2px 0", letterSpacing: "0.5px" }}>
              PEMERINTAH KABUPATEN TAPANULI SELATAN
            </h2>
            <h1 style={{ fontSize: 15, fontWeight: "bold", margin: "0 0 2px 0", letterSpacing: "0.5px" }}>
              REGISTER SPJ BENDAHARA PENGELUARAN
            </h1>
            <h3 style={{ fontSize: 14, fontWeight: "bold", margin: 0, letterSpacing: "0.5px" }}>
              TAHUN ANGGARAN {tahun}
            </h3>
            <p style={{ fontSize: 12, margin: "4px 0 0 0" }}>
              BULAN {BULAN_NAMA[data.bulan]?.toUpperCase()} {tahun}
            </p>
          </div>

          {/* Metadata Parameters Table */}
          <div style={{ width: "100%", marginBottom: 14, fontSize: 12 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td style={{ width: 125, padding: "2px 0", verticalAlign: "top" }}>Unit/UPT</td>
                  <td style={{ width: 15, padding: "2px 0", verticalAlign: "top" }}>:</td>
                  <td style={{ padding: "2px 0", verticalAlign: "top", fontWeight: "bold" }}>
                    {data.upt?.kd_upt ? `${data.upt?.kd_upt} - ${data.upt?.nm_upt}` : "Dinas Kesehatan Daerah"}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "2px 0", verticalAlign: "top" }}>Pengguna Anggaran/KPA</td>
                  <td style={{ padding: "2px 0", verticalAlign: "top" }}>:</td>
                  <td style={{ padding: "2px 0", verticalAlign: "top" }}>
                    {data.penandatanganKpa?.nama || "-"}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: "2px 0", verticalAlign: "top" }}>Bendahara Pengeluaran</td>
                  <td style={{ padding: "2px 0", verticalAlign: "top" }}>:</td>
                  <td style={{ padding: "2px 0", verticalAlign: "top" }}>
                    {data.penandatanganBendahara?.nama || "-"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Table Data Permendagri 77/2020 */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, border: "1px solid #000" }}>
              <thead>
                <tr style={{ background: "#fff", textAlign: "center" }}>
                  <th style={{ border: "1px solid #000", padding: "6px 6px", width: 40, fontWeight: "bold" }}>
                    NO
                  </th>
                  <th style={{ border: "1px solid #000", padding: "6px 8px", width: 85, fontWeight: "bold" }}>
                    TANGGAL
                  </th>
                  <th style={{ border: "1px solid #000", padding: "6px 8px", width: 220, fontWeight: "bold" }}>
                    NO. BUKTI TRANSAKSI
                  </th>
                  <th style={{ border: "1px solid #000", padding: "6px 8px", fontWeight: "bold" }}>
                    URAIAN PENGELUARAN
                  </th>
                  <th style={{ border: "1px solid #000", padding: "6px 8px", width: 140, fontWeight: "bold" }}>
                    JUMLAH (Rp)
                  </th>
                  <th style={{ border: "1px solid #000", padding: "6px 8px", width: 130, fontWeight: "bold" }}>
                    STATUS
                  </th>
                </tr>
                <tr style={{ background: "#fff", textAlign: "center", fontSize: 10 }}>
                  <th style={{ border: "1px solid #000", padding: "3px 4px", fontWeight: "bold" }}>1</th>
                  <th style={{ border: "1px solid #000", padding: "3px 4px", fontWeight: "bold" }}>2</th>
                  <th style={{ border: "1px solid #000", padding: "3px 4px", fontWeight: "bold" }}>3</th>
                  <th style={{ border: "1px solid #000", padding: "3px 4px", fontWeight: "bold" }}>4</th>
                  <th style={{ border: "1px solid #000", padding: "3px 4px", fontWeight: "bold" }}>5</th>
                  <th style={{ border: "1px solid #000", padding: "3px 4px", fontWeight: "bold" }}>6</th>
                </tr>
              </thead>
              <tbody>
                {data.items.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ border: "1px solid #000", padding: "20px 8px", textAlign: "center", color: "#666", fontStyle: "italic" }}>
                      Belum ada transaksi pengeluaran belanja pada periode ini.
                    </td>
                  </tr>
                ) : (
                  data.items.map((item) => (
                    <tr key={item.id}>
                      <td style={{ border: "1px solid #000", padding: "5px 6px", textAlign: "center" }}>
                        {item.no_urut}
                      </td>
                      <td style={{ border: "1px solid #000", padding: "5px 8px", textAlign: "center" }}>
                        {formatDateIndo(item.tgl_spj)}
                      </td>
                      <td style={{ border: "1px solid #000", padding: "5px 8px", fontFamily: "monospace", fontSize: 11 }}>
                        {item.no_spj}
                      </td>
                      <td style={{ border: "1px solid #000", padding: "6px 8px" }}>
                        <div style={{ fontWeight: 600, color: "#0F172A", marginBottom: 3 }}>
                          {item.uraian}
                        </div>
                        {(item.sub_kegiatan || item.rekening_belanja) && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 2, fontSize: 10.5, color: "#475569" }}>
                            {item.sub_kegiatan && (
                              <div>
                                <span style={{ fontWeight: 600, color: "#2563EB" }}>Sub Kegiatan:</span> {item.sub_kegiatan}
                              </div>
                            )}
                            {item.rekening_belanja && (
                              <div>
                                <span style={{ fontWeight: 600, color: "#059669" }}>Rekening:</span> {item.rekening_belanja}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td style={{ border: "1px solid #000", padding: "5px 8px", textAlign: "right", fontFamily: "monospace", fontWeight: 600 }}>
                        {formatCurrencyRupiah(item.jumlah_belanja)}
                      </td>
                      <td style={{ border: "1px solid #000", padding: "5px 8px", textAlign: "center", fontSize: 10 }}>
                        <span style={{ color: "#059669", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <CheckCircle2 size={13} /> {item.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))
                )}

                {/* Baris Total */}
                <tr style={{ fontWeight: "bold", background: "#f5f5f5" }}>
                  <td colSpan={4} style={{ border: "1px solid #000", padding: "6px 8px", textAlign: "right" }}>
                    TOTAL REGISTER PENGELUARAN
                  </td>
                  <td style={{ border: "1px solid #000", padding: "6px 8px", textAlign: "right", fontFamily: "monospace", fontSize: 12 }}>
                    {formatCurrencyRupiah(data.summary.totalJumlahSpj)}
                  </td>
                  <td style={{ border: "1px solid #000", padding: "6px 8px", textAlign: "center" }}>
                    {data.summary.totalDokumen} Transaksi
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
              <p style={{ margin: "0 0 4px 0" }}>Sipirok, {formatDateIndo(new Date())}</p>
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
