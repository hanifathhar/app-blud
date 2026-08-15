"use client";

import { useState, useEffect } from "react";
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
}
interface UserInfo { role: string; kd_upt: string | null; upt?: { nm_upt: string } | null; }

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

  useEffect(() => {
    const t = localStorage.getItem("tahunName");
    if (t) setTahun(parseInt(t));
  }, []);

  const loadData = () => {
    setLoading(true);
    fetch(`/api/pelaporan/realisasi?tahun=${tahun}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((d) => d.user && setUser(d.user));
  }, []);
  useEffect(() => { if (user) loadData(); }, [user, tahun]);

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

  return (
    <div className="animate-fadein">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>📊 Laporan Realisasi Anggaran</h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>
            {user?.upt?.nm_upt || "Semua UPT"} — Tahun Anggaran {tahun}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ display: "flex", background: "#F1F5F9", borderRadius: 9, padding: 3, gap: 2 }}>
            <button
              className="btn btn-sm"
              style={{ background: chartType === "bar" ? "#2563EB" : "transparent", color: chartType === "bar" ? "#fff" : "#64748B", padding: "5px 12px" }}
              onClick={() => setChartType("bar")}
            >
              Bar
            </button>
            <button
              className="btn btn-sm"
              style={{ background: chartType === "line" ? "#2563EB" : "transparent", color: chartType === "line" ? "#fff" : "#64748B", padding: "5px 12px" }}
              onClick={() => setChartType("line")}
            >
              Line
            </button>
          </div>
          <div style={{ background: "#F1F5F9", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, color: "#475569", border: "1px solid #E2E8F0" }}>
            TA {tahun}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="empty-state" style={{ minHeight: "50vh" }}>
          <div className="loading-spinner" style={{ width: 36, height: 36 }} />
          <p style={{ marginTop: 12 }}>Memuat laporan...</p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
            <div className="stat-card" style={{ padding: 20, borderLeft: "4px solid #2563EB" }}>
              <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Pagu Anggaran</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#2563EB" }}>{formatRupiah(data?.summary.totalPagu || 0)}</div>
              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>TA {tahun}</div>
            </div>
            <div className="stat-card" style={{ padding: 20, borderLeft: "4px solid #10B981" }}>
              <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Realisasi s.d Sekarang</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#10B981" }}>{formatRupiah(data?.summary.totalRealisasi || 0)}</div>
              <div style={{ marginTop: 8 }}>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${Math.min(pct, 100)}%`, background: pctColor }} />
                </div>
              </div>
            </div>
            <div className="stat-card" style={{ padding: 20, borderLeft: `4px solid ${pctColor}` }}>
              <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Persentase Realisasi</div>
              <div style={{ fontSize: 40, fontWeight: 900, color: pctColor, lineHeight: 1 }}>{pct.toFixed(1)}%</div>
              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>
                {pct >= 80 ? "✅ Baik" : pct >= 50 ? "⚠️ Sedang" : "🔴 Rendah"}
              </div>
            </div>
            <div className="stat-card" style={{ padding: 20, borderLeft: "4px solid #8B5CF6" }}>
              <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Sisa Anggaran</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: "#8B5CF6" }}>{formatRupiah(data?.summary.sisa || 0)}</div>
              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>Belum direalisasi</div>
            </div>
          </div>

          {/* Chart */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <span className="card-title">
                {chartType === "bar" ? "📊 Realisasi per Bulan" : "📈 Kumulatif Realisasi"} — {tahun}
              </span>
            </div>
            <div className="card-body">
              {chartData.length > 0 ? (
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
                      <Bar dataKey="realisasi" name="Realisasi" fill="#2563EB" radius={[5, 5, 0, 0]} />
                      <Bar dataKey="target" name="Target Bulanan" fill="#E2E8F0" radius={[5, 5, 0, 0]} />
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
                  <p>Belum ada data realisasi untuk tahun {tahun}</p>
                </div>
              )}
            </div>
          </div>

          {/* Tabel per bulan */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Detail Realisasi per Bulan</span>
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
        </>
      )}
    </div>
  );
}
