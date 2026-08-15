"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";

interface UptStat {
  id: number;
  nm_upt: string;
  type: string;
  kd_upt: string | null;
  totalPagu: number;
  totalRealisasi: number;
  persentase: number;
  sisa: number;
  jumlahDpa: number;
  sppPending: number;
  status_keuangan: "baik" | "sedang" | "rendah";
}

interface MonitoringData {
  summary: {
    totalUpt: number;
    totalPagu: number;
    totalRealisasi: number;
    persentase: string;
    uptBaik: number;
    uptSedang: number;
    uptRendah: number;
  };
  data: UptStat[];
}

const STATUS_COLOR = { baik: "#10B981", sedang: "#F59E0B", rendah: "#F43F5E" };
const STATUS_BG = { baik: "#ECFDF5", sedang: "#FFFBEB", rendah: "#FFF1F2" };
const STATUS_LABEL = { baik: "✅ Baik (≥80%)", sedang: "⚠️ Sedang (50-80%)", rendah: "🔴 Rendah (<50%)" };

function formatRupiah(val: number): string {
  if (val >= 1_000_000_000) return `Rp ${(val / 1_000_000_000).toFixed(1)} M`;
  if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(1)} Jt`;
  return `Rp ${(val / 1_000).toFixed(0)} Rb`;
}

export default function MonitoringPage() {
  const [data, setData] = useState<MonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");
  const [sortBy, setSortBy] = useState<"nm_upt" | "persentase" | "totalPagu">("persentase");
  const router = useRouter();

  useEffect(() => {
    const t = localStorage.getItem("tahunName");
    if (t) setTahun(parseInt(t));
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/monitoring?tahun=${tahun}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, [tahun]);

  const filtered = (data?.data || [])
    .filter((u) => (!filterStatus || u.status_keuangan === filterStatus) && (!filterType || u.type === filterType))
    .sort((a, b) => {
      if (sortBy === "persentase") return b.persentase - a.persentase;
      if (sortBy === "totalPagu") return b.totalPagu - a.totalPagu;
      return (a.nm_upt || "").localeCompare(b.nm_upt || "");
    });

  const chartData = filtered.slice(0, 15).map((u) => ({
    nama: u.nm_upt.length > 20 ? u.nm_upt.slice(0, 20) + "…" : u.nm_upt,
    realisasi: u.totalRealisasi,
    pagu: u.totalPagu,
    pct: u.persentase,
  }));

  const types = [...new Set((data?.data || []).map((u) => u.type).filter(Boolean))];
  const pctAll = parseFloat(data?.summary.persentase || "0");
  const pctColor = pctAll >= 80 ? "#10B981" : pctAll >= 50 ? "#F59E0B" : "#F43F5E";

  return (
    <div className="animate-fadein">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>🔍 Monitoring Keuangan BLUD</h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>
            Dashboard konsolidasi seluruh UPT — Superadmin View
          </p>
        </div>
        <div style={{ background: "#F1F5F9", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, color: "#475569", border: "1px solid #E2E8F0" }}>
          Tahun Anggaran {tahun}
        </div>
      </div>

      {loading ? (
        <div className="empty-state" style={{ minHeight: "50vh" }}>
          <div className="loading-spinner" style={{ width: 36, height: 36 }} />
          <p style={{ marginTop: 12 }}>Memuat data monitoring...</p>
        </div>
      ) : data ? (
        <>
          {/* Summary Banner */}
          <div
            style={{
              background: "linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)",
              borderRadius: 16, padding: "24px 28px", marginBottom: 24,
              display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 20,
              position: "relative", overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", top: -30, right: -30, width: 200, height: 200, background: "rgba(37,99,235,0.1)", borderRadius: "50%" }} />
            {[
              { label: "Total UPT", value: `${data.summary.totalUpt}`, color: "#60A5FA" },
              { label: "Total Pagu", value: formatRupiah(data.summary.totalPagu), color: "#FFFFFF" },
              { label: "Total Realisasi", value: formatRupiah(data.summary.totalRealisasi), color: "#34D399" },
              { label: "% Realisasi", value: `${pctAll.toFixed(1)}%`, color: pctColor },
              { label: "UPT Status Baik", value: `${data.summary.uptBaik}`, color: "#10B981" },
              { label: "UPT Status Rendah", value: `${data.summary.uptRendah}`, color: "#F87171" },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginBottom: 4, fontWeight: 600 }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Filters & Sort */}
          <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
            <select className="form-select" style={{ width: 160 }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">Semua Status</option>
              <option value="baik">✅ Baik</option>
              <option value="sedang">⚠️ Sedang</option>
              <option value="rendah">🔴 Rendah</option>
            </select>
            <select className="form-select" style={{ width: 150 }} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="">Semua Jenis</option>
              {types.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <select className="form-select" style={{ width: 180 }} value={sortBy} onChange={(e) => setSortBy(e.target.value as "nm_upt" | "persentase" | "totalPagu")}>
              <option value="persentase">Urutkan: % Realisasi</option>
              <option value="totalPagu">Urutkan: Pagu Terbesar</option>
              <option value="nm_upt">Urutkan: Nama UPT</option>
            </select>
            <span style={{ marginLeft: "auto", fontSize: 12.5, color: "#64748B", alignSelf: "center" }}>
              {filtered.length} UPT ditampilkan
            </span>
          </div>

          {/* Bar Chart Comparison */}
          {chartData.length > 0 && (
            <div className="card" style={{ marginBottom: 24 }}>
              <div className="card-header">
                <span className="card-title">📊 Perbandingan Realisasi antar UPT — {tahun}</span>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData} layout="vertical" margin={{ left: 140 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#94A3B8" }} tickFormatter={(v) => formatRupiah(v)} />
                    <YAxis type="category" dataKey="nama" tick={{ fontSize: 11, fill: "#475569" }} width={140} />
                    <Tooltip formatter={(v: any) => [formatRupiah(Number(v))]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="realisasi" name="Realisasi" fill="#2563EB" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="pagu" name="Pagu" fill="#E2E8F0" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* UPT Cards Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
            {filtered.map((upt) => {
              const sColor = STATUS_COLOR[upt.status_keuangan];
              const sBg = STATUS_BG[upt.status_keuangan];
              return (
                <div
                  key={upt.id}
                  className="card"
                  style={{
                    cursor: "pointer", transition: "all 0.2s ease",
                    borderTop: `3px solid ${sColor}`,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 8px 24px ${sColor}20`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = ""; }}
                  onClick={() => router.push(`/dashboard/pelaporan/realisasi`)}
                >
                  <div style={{ padding: "16px 16px 0" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{upt.nm_upt}</div>
                        <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                          {upt.type} {upt.kd_upt ? `• ${upt.kd_upt}` : ""}
                        </div>
                      </div>
                      <span
                        style={{
                          background: sBg, color: sColor, fontSize: 11, fontWeight: 700,
                          padding: "3px 10px", borderRadius: 20, flexShrink: 0,
                        }}
                      >
                        {upt.persentase}%
                      </span>
                    </div>

                    <div className="progress-bar" style={{ marginBottom: 10 }}>
                      <div
                        className="progress-fill"
                        style={{ width: `${Math.min(upt.persentase, 100)}%`, background: `linear-gradient(90deg, ${sColor}, ${sColor}cc)` }}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                      <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "8px 10px" }}>
                        <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600 }}>PAGU</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{formatRupiah(upt.totalPagu)}</div>
                      </div>
                      <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "8px 10px" }}>
                        <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600 }}>REALISASI</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: sColor }}>{formatRupiah(upt.totalRealisasi)}</div>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      borderTop: "1px solid #F1F5F9", padding: "10px 16px",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}
                  >
                    <span style={{ fontSize: 11, color: "#64748B" }}>{upt.jumlahDpa} DPA disetujui</span>
                    {upt.sppPending > 0 ? (
                      <span style={{ fontSize: 11, color: "#F59E0B", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                        ⏳ {upt.sppPending} SPP pending
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, color: "#10B981", fontWeight: 600 }}>✅ Tidak ada pending</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="empty-state" style={{ padding: 48 }}>
              <div className="empty-state-icon">🔍</div>
              <p style={{ fontWeight: 600 }}>Tidak ada UPT sesuai filter</p>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
