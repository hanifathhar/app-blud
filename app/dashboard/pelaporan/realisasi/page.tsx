"use client";

import { useState, useEffect } from "react";
import Select from "react-select";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from "recharts";

interface RealisasiData {
  summary: {
    totalPagu: number;
    totalRealisasi: number;
    persentase: string;
    sisa: number;
  };
  chartData: Array<{ bulan: number; realisasi: number; pagu: number }>;
  rekeningSummary?: Array<{
    kd_rek6: string;
    nm_rek6: string;
    kd_sub_kegiatan: string;
    nm_sub_kegiatan: string;
    total: number;
  }>;
}
interface UserInfo { role: string; kd_upt: string | null; unit?: string; level?: number; upt?: { nm_upt: string } | null; }

const BULAN = ["", "Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function formatRupiah(val: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
}

function formatShort(val: number): string {
  if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}M`;
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}Jt`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}Rb`;
  return String(val);
}

export default function RealisasiPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [data, setData] = useState<RealisasiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [chartType, setChartType] = useState<"bar" | "line">("bar");
  const [upts, setUpts] = useState<any[]>([]);
  const [filterUpt, setFilterUpt] = useState("");

  const isSuperAdmin = user?.role === "superadmin" || user?.level === 1;

  useEffect(() => {
    const t = localStorage.getItem("tahunName");
    if (t) setTahun(parseInt(t));
    fetch("/api/upt").then((r) => r.json()).then((d) => setUpts(d.data || []));
  }, []);

  const loadData = () => {
    setLoading(true);
    const activeUpt = isSuperAdmin ? filterUpt : (user?.kd_upt || user?.unit || "");
    fetch(`/api/pelaporan/realisasi?tahun=${tahun}&kd_upt=${activeUpt}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((d) => d.user && setUser(d.user));
  }, []);

  useEffect(() => {
    if (user) loadData();
  }, [user, tahun, filterUpt]);

  const chartData = (data?.chartData || []).map((d) => ({
    nama: BULAN[d.bulan],
    realisasi: d.realisasi,
    target: d.pagu,
  }));

  const pct = parseFloat(data?.summary.persentase || "0");
  const pctColor = pct >= 80 ? "#10B981" : pct >= 50 ? "#F59E0B" : "#F43F5E";

  const cumulative = chartData.reduce((acc, row, i) => {
    const prev = i > 0 ? acc[i - 1].kumulatif : 0;
    acc.push({ ...row, kumulatif: prev + row.realisasi });
    return acc;
  }, [] as Array<{ nama: string; realisasi: number; target: number; kumulatif: number }>);

  const activeUptName = isSuperAdmin
    ? (filterUpt ? upts.find((u) => u.kd_upt === filterUpt)?.nm_upt || filterUpt : "Semua UPT")
    : (user?.upt?.nm_upt || "UPT Terpilih");

  return (
    <div className="animate-fadein">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>📊 Laporan Realisasi Pengeluaran</h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>
            {activeUptName} — Tahun Anggaran {tahun}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          {isSuperAdmin && (
            <div style={{ minWidth: 260 }}>
              <Select
                options={upts.map((u) => ({ value: u.kd_upt || "", label: `${u.kd_upt ? `[${u.kd_upt}] ` : ""}${u.nm_upt}` }))}
                value={filterUpt ? { value: filterUpt, label: upts.find((u) => u.kd_upt === filterUpt)?.nm_upt || filterUpt } : null}
                onChange={(selected: any) => setFilterUpt(selected?.value || "")}
                placeholder="-- Semua Unit UPT --"
                isClearable
                menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                styles={{
                  control: (base) => ({ ...base, borderColor: "#CBD5E1", borderRadius: "0.375rem", minHeight: "38px", fontSize: "13px" }),
                  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                }}
              />
            </div>
          )}
          <div style={{ display: "flex", background: "#F1F5F9", borderRadius: 9, padding: 3, gap: 2, height: "38px", alignItems: "center" }}>
            <button
              className="btn btn-sm"
              style={{ background: chartType === "bar" ? "#2563EB" : "transparent", color: chartType === "bar" ? "#fff" : "#64748B", padding: "5px 12px", height: "32px" }}
              onClick={() => setChartType("bar")}
            >
              Bar
            </button>
            <button
              className="btn btn-sm"
              style={{ background: chartType === "line" ? "#2563EB" : "transparent", color: chartType === "line" ? "#fff" : "#64748B", padding: "5px 12px", height: "32px" }}
              onClick={() => setChartType("line")}
            >
              Line
            </button>
          </div>
          <div style={{ background: "#F1F5F9", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, color: "#475569", border: "1px solid #E2E8F0", height: "38px", display: "flex", alignItems: "center" }}>
            TA {tahun}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="empty-state" style={{ minHeight: "50vh" }}>
          <div className="loading-spinner" style={{ width: 36, height: 36 }} />
          <p style={{ marginTop: 12 }}>Memuat laporan realisasi...</p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
            <div className="stat-card" style={{ padding: 20, borderLeft: "4px solid #2563EB" }}>
              <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Pagu Belanja (RBA)</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#2563EB" }}>{formatRupiah(data?.summary.totalPagu || 0)}</div>
              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>Pagu Anggaran TA {tahun}</div>
            </div>
            <div className="stat-card" style={{ padding: 20, borderLeft: "4px solid #10B981" }}>
              <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Realisasi Pengeluaran</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#10B981" }}>{formatRupiah(data?.summary.totalRealisasi || 0)}</div>
              <div style={{ marginTop: 8 }}>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${Math.min(pct, 100)}%`, background: pctColor }} />
                </div>
              </div>
            </div>
            <div className="stat-card" style={{ padding: 20, borderLeft: `4px solid ${pctColor}` }}>
              <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Persentase Realisasi</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: pctColor, lineHeight: 1 }}>{pct.toFixed(1)}%</div>
              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>
                {pct >= 80 ? "✅ Baik" : pct >= 50 ? "⚠️ Sedang" : "🔴 Rendah"}
              </div>
            </div>
            <div className="stat-card" style={{ padding: 20, borderLeft: "4px solid #8B5CF6" }}>
              <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Sisa Pagu Anggaran</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: (data?.summary.sisa || 0) >= 0 ? "#8B5CF6" : "#F43F5E" }}>{formatRupiah(data?.summary.sisa || 0)}</div>
              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>Sisa belanja belum terealisasi</div>
            </div>
          </div>

          {/* Chart */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <span className="card-title">
                {chartType === "bar" ? "📊 Realisasi Pengeluaran per Bulan" : "📈 Kumulatif Realisasi Pengeluaran"} — {tahun}
              </span>
            </div>
            <div className="card-body">
              {chartData.some((d) => d.realisasi > 0 || d.target > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  {chartType === "bar" ? (
                    <BarChart data={chartData} barCategoryGap="25%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="nama" tick={{ fontSize: 11, fill: "#94A3B8" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} tickFormatter={formatShort} />
                      <Tooltip
                        formatter={(v: any, n: any) => [formatRupiah(Number(v) || 0), n === "realisasi" ? "Realisasi" : "Target"]}
                        contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="realisasi" name="Realisasi Pengeluaran" fill="#2563EB" radius={[5, 5, 0, 0]} />
                      <Bar dataKey="target" name="Rata-rata Target" fill="#E2E8F0" radius={[5, 5, 0, 0]} />
                    </BarChart>
                  ) : (
                    <LineChart data={cumulative}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="nama" tick={{ fontSize: 11, fill: "#94A3B8" }} />
                      <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} tickFormatter={formatShort} />
                      <Tooltip
                        formatter={(v: any) => [formatRupiah(Number(v) || 0)]}
                        contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line type="monotone" dataKey="kumulatif" name="Kumulatif Realisasi" stroke="#2563EB" strokeWidth={2.5} dot={{ r: 4, fill: "#2563EB" }} />
                      <Line type="monotone" dataKey="realisasi" name="Realisasi Bulanan" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, fill: "#10B981" }} />
                    </LineChart>
                  )}
                </ResponsiveContainer>
              ) : (
                <div className="empty-state" style={{ padding: 48 }}>
                  <div className="empty-state-icon">📊</div>
                  <p>Belum ada data pengeluaran untuk tahun {tahun}</p>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: data?.rekeningSummary && data.rekeningSummary.length > 0 ? "1fr 1fr" : "1fr", gap: 20 }}>
            {/* Tabel per bulan */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">📅 Detail Realisasi per Bulan</span>
              </div>
              <div className="tbl-wrap" style={{ borderRadius: 0 }}>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Bulan</th>
                      <th style={{ textAlign: "right" }}>Realisasi</th>
                      <th style={{ textAlign: "right" }}>Kumulatif</th>
                      <th>% Kumulatif</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cumulative.map((row, i) => {
                      const rowPct = data?.summary.totalPagu ? (row.kumulatif / data.summary.totalPagu) * 100 : 0;
                      const color = rowPct >= 80 ? "#10B981" : rowPct >= 50 ? "#F59E0B" : "#94A3B8";
                      return (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{row.nama}</td>
                          <td style={{ textAlign: "right", fontWeight: 600, color: "#2563EB" }}>{formatRupiah(row.realisasi)}</td>
                          <td style={{ textAlign: "right", fontWeight: 700 }}>{formatRupiah(row.kumulatif)}</td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div className="progress-bar" style={{ flex: 1 }}>
                                <div className="progress-fill" style={{ width: `${Math.min(rowPct, 100)}%`, background: color }} />
                              </div>
                              <span style={{ fontSize: 11.5, fontWeight: 700, color, width: 44, textAlign: "right" }}>
                                {rowPct.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="tbl-total">
                      <td style={{ fontWeight: 800 }}>TOTAL</td>
                      <td style={{ textAlign: "right", fontWeight: 800, color: "#10B981" }}>{formatRupiah(data?.summary.totalRealisasi || 0)}</td>
                      <td style={{ textAlign: "right", fontWeight: 800 }}>{formatRupiah(data?.summary.totalRealisasi || 0)}</td>
                      <td style={{ fontWeight: 800, color: pctColor }}>{pct.toFixed(2)}%</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Tabel per Rekening Belanja */}
            {data?.rekeningSummary && data.rekeningSummary.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <span className="card-title">💳 Realisasi per Rekening Belanja</span>
                  <span style={{ fontSize: 12, color: "#94A3B8" }}>{data.rekeningSummary.length} Rekening</span>
                </div>
                <div className="tbl-wrap" style={{ borderRadius: 0, maxHeight: 480, overflowY: "auto" }}>
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th>Kode & Nama Rekening</th>
                        <th style={{ textAlign: "right" }}>Total Realisasi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.rekeningSummary.map((rek, idx) => (
                        <tr key={idx}>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: 12, color: "#1E293B" }}>{rek.kd_rek6} - {rek.nm_rek6}</div>
                            {rek.nm_sub_kegiatan && (
                              <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{rek.nm_sub_kegiatan}</div>
                            )}
                          </td>
                          <td style={{ textAlign: "right", fontWeight: 700, color: "#2563EB", whiteSpace: "nowrap" }}>
                            {formatRupiah(rek.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="tbl-total">
                        <td style={{ fontWeight: 800 }}>TOTAL PENGELUARAN</td>
                        <td style={{ textAlign: "right", fontWeight: 800, color: "#10B981" }}>
                          {formatRupiah(data?.summary.totalRealisasi || 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
