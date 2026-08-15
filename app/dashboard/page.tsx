"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Building2,
  Wallet,
  BarChart3,
  BookOpen,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from "recharts";

interface UserInfo {
  nama: string;
  role: string;
  roleLabel: string;
  kd_upt: string | null;
  upt?: { nm_upt: string; type: string } | null;
}

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function formatRupiah(val: number): string {
  if (val >= 1_000_000_000) return `Rp ${(val / 1_000_000_000).toFixed(1)} M`;
  if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(1)} Jt`;
  if (val >= 1_000) return `Rp ${(val / 1_000).toFixed(0)} Rb`;
  return `Rp ${val.toFixed(0)}`;
}

// ============================================================
// Widget Komponen
// ============================================================

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
  onClick,
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  color: string;
  onClick?: () => void;
}) {
  return (
    <div className="stat-card" onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
      <div
        className="stat-card-icon"
        style={{ background: `${color}18`, color: color }}
      >
        {icon}
      </div>
      <div className="stat-card-value">{value}</div>
      <div className="stat-card-label">{label}</div>
      {sub && (
        <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>{sub}</div>
      )}
    </div>
  );
}

function ProgressBar({ pagu, realisasi, label }: { pagu: number; realisasi: number; label: string }) {
  const pct = pagu > 0 ? Math.min((realisasi / pagu) * 100, 100) : 0;
  const color = pct >= 80 ? "#10B981" : pct >= 50 ? "#F59E0B" : "#F43F5E";
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 12.5, color: "#475569", fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{pct.toFixed(1)}%</span>
      </div>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)` }}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
        <span style={{ fontSize: 10.5, color: "#94A3B8" }}>Realisasi: {formatRupiah(realisasi)}</span>
        <span style={{ fontSize: 10.5, color: "#94A3B8" }}>Pagu: {formatRupiah(pagu)}</span>
      </div>
    </div>
  );
}

// ============================================================
// DASHBOARD SUPERADMIN
// ============================================================

function DashboardSuperadmin() {
  const [data, setData] = useState<{
    summary: { totalUpt: number; totalPagu: number; totalPendapatan: number; totalBelanja: number; totalRealisasi: number; persentase: string; uptBaik: number; uptSedang: number; uptRendah: number };
    data: Array<{
      id: number; nm_upt: string; type: string;
      totalPagu: number; totalPendapatan: number; totalBelanja: number; totalRealisasi: number; persentase: number; sisa: number;
      sppPending: number; status_keuangan: string;
    }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [tahun, setTahun] = useState(new Date().getFullYear());
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

  const STATUS_COLOR: Record<string, string> = { baik: "#10B981", sedang: "#F59E0B", rendah: "#F43F5E" };

  return (
    <div className="animate-fadein">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>
            🏥 Monitoring Keuangan BLUD
          </h2>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>
            Konsolidasi seluruh UPT Dinas Kesehatan
          </p>
        </div>
        <div style={{ background: "#F1F5F9", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, color: "#475569", border: "1px solid #E2E8F0" }}>
          Tahun Anggaran {tahun}
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><div className="loading-spinner" /> <p style={{ marginTop: 12 }}>Memuat data...</p></div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
            <StatCard icon="🏥" label="Total UPT Aktif" value={`${data.summary.totalUpt}`} color="#2563EB" />
            <StatCard icon="💰" label="Anggaran Belanja" value={formatRupiah(data.summary.totalBelanja)} sub={`TA ${tahun}`} color="#10B981" />
            <StatCard icon="📊" label="Realisasi Belanja" value={formatRupiah(data.summary.totalRealisasi)} sub={`${data.summary.persentase}% dari pagu`} color="#8B5CF6" />
            <StatCard icon="✅" label="Realisasi Baik (≥80%)" value={`${data.summary.uptBaik} UPT`} color="#10B981" />
            <StatCard icon="⚠️" label="Realisasi Rendah (<50%)" value={`${data.summary.uptRendah} UPT`} color="#F43F5E" />
          </div>

          {/* UPT Cards Grid */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <span className="card-title">📍 Status per UPT</span>
            </div>
            <div className="card-body" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
              {data.data.map((upt) => (
                <div
                  key={upt.id}
                  style={{
                    border: `1px solid ${STATUS_COLOR[upt.status_keuangan]}30`,
                    borderRadius: 12, padding: 16, cursor: "pointer",
                    background: `${STATUS_COLOR[upt.status_keuangan]}08`,
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 4px 16px ${STATUS_COLOR[upt.status_keuangan]}25`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "none"; }}
                  onClick={() => router.push(`/dashboard/pelaporan/realisasi?upt=${upt.nm_upt}`)}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>{upt.nm_upt}</div>
                      <div style={{ fontSize: 11, color: "#64748B", marginTop: 1 }}>{upt.type}</div>
                    </div>
                    <span
                      className="badge"
                      style={{ background: `${STATUS_COLOR[upt.status_keuangan]}18`, color: STATUS_COLOR[upt.status_keuangan] }}
                    >
                      {upt.status_keuangan === "baik" ? "✅ Baik" : upt.status_keuangan === "sedang" ? "⚠️ Sedang" : "🔴 Rendah"}
                    </span>
                  </div>
                  <div className="progress-bar" style={{ marginBottom: 6 }}>
                    <div
                      className="progress-fill"
                      style={{
                        width: `${upt.persentase}%`,
                        background: `linear-gradient(90deg, ${STATUS_COLOR[upt.status_keuangan]}, ${STATUS_COLOR[upt.status_keuangan]}bb)`,
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div style={{ fontSize: 11, color: "#64748B" }}>
                      <div style={{ marginBottom: 2 }}>Belanja: <span style={{ fontWeight: 600, color: "#334155" }}>{formatRupiah(upt.totalBelanja)}</span></div>
                      <div>Realisasi Belanja: <span style={{ fontWeight: 600, color: "#334155" }}>{formatRupiah(upt.totalRealisasi)}</span></div>
                    </div>
                    <div style={{ textAlign: "right", fontSize: 11, color: "#64748B" }}>
                      <div style={{ marginBottom: 2 }}>Sisa Pagu (Belanja)</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: upt.sisa < 0 ? "#F43F5E" : "#10B981" }}>
                        {formatRupiah(upt.sisa)}
                      </div>
                    </div>
                  </div>
                  {upt.sppPending > 0 && (
                    <div style={{ marginTop: 8, fontSize: 11, color: "#F59E0B", display: "flex", alignItems: "center", gap: 4 }}>
                      <Clock size={12} /> {upt.sppPending} SPP menunggu proses
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

// ============================================================
// DASHBOARD UPT (KPA, Perencana, Keuangan, Bendahara)
// ============================================================

function DashboardUpt({ user }: { user: UserInfo }) {
  const [realisasi, setRealisasi] = useState<{
    summary: { totalPagu: number; totalPendapatan: number; totalBelanja: number; totalRealisasi: number; persentase: string; sisa: number };
    chartData: Array<{ bulan: number; realisasi: number; pagu: number }>;
  } | null>(null);
  const [sppData, setSppData] = useState<{ total: number; pending: number; disetujui: number }>({ total: 0, pending: 0, disetujui: 0 });
  const [loading, setLoading] = useState(true);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const router = useRouter();

  useEffect(() => {
    const t = localStorage.getItem("tahunName");
    if (t) setTahun(parseInt(t));
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/pelaporan/realisasi?tahun=${tahun}`).then((r) => r.json()),
      fetch(`/api/penatausahaan/spp`).then((r) => r.json()),
    ]).then(([r, s]) => {
      setRealisasi(r);
      const list = s.data || [];
      setSppData({
        total: list.length,
        pending: list.filter((x: { status: string }) => ["diajukan", "diverifikasi"].includes(x.status)).length,
        disetujui: list.filter((x: { status: string }) => x.status === "disetujui").length,
      });
    }).finally(() => setLoading(false));
  }, [tahun]);

  const chartData = (realisasi?.chartData || []).map((d) => ({
    ...d,
    nama: BULAN[d.bulan - 1],
  }));

  return (
    <div className="animate-fadein">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>
            👋 Selamat Datang, {user.nama}
          </h2>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>
            {user.upt?.nm_upt} — {user.roleLabel} — TA {tahun}
          </p>
        </div>
        <div style={{ background: "#F1F5F9", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, color: "#475569", border: "1px solid #E2E8F0" }}>
          Tahun Anggaran {tahun}
        </div>
      </div>

      {loading ? (
        <div className="empty-state"><div className="loading-spinner" /><p style={{ marginTop: 12 }}>Memuat data...</p></div>
      ) : (
        <>
          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(175px, 1fr))", gap: 16, marginBottom: 24 }}>
            <StatCard
              icon="💰"
              label="Anggaran Belanja"
              value={formatRupiah(realisasi?.summary.totalBelanja || 0)}
              sub={`TA ${tahun}`}
              color="#2563EB"
              onClick={() => router.push("/dashboard/perencanaan/penetapan-rba")}
            />
            <StatCard
              icon="📊"
              label="Realisasi Belanja"
              value={formatRupiah(realisasi?.summary.totalRealisasi || 0)}
              sub={`${realisasi?.summary.persentase || 0}%`}
              color="#10B981"
              onClick={() => router.push("/dashboard/pelaporan/realisasi")}
            />
            <StatCard
              icon="💳"
              label="Sisa Anggaran"
              value={formatRupiah(realisasi?.summary.sisa || 0)}
              color="#8B5CF6"
            />
            <StatCard
              icon="📄"
              label="SPP Pending"
              value={`${sppData.pending}`}
              sub="Menunggu proses"
              color="#F59E0B"
              onClick={() => router.push("/dashboard/penatausahaan/spp")}
            />
          </div>

          {/* Chart Realisasi */}
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <span className="card-title">📈 Grafik Realisasi Anggaran {tahun}</span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => router.push("/dashboard/pelaporan/realisasi")}
              >
                Lihat Detail <ArrowRight size={14} />
              </button>
            </div>
            <div className="card-body">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={chartData} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="nama" tick={{ fontSize: 11, fill: "#94A3B8" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} tickFormatter={(v) => formatRupiah(v)} />
                    <Tooltip
                      formatter={(v: any) => [formatRupiah(Number(v) || 0)]}
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #E2E8F0" }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="realisasi" name="Realisasi" fill="#2563EB" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="pagu" name="Target" fill="#E2E8F0" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">📊</div>
                  <p>Belum ada data realisasi anggaran</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
            {user.role === "perencana" && (
              <>
                <QuickAction icon="📋" label="Input RKA" desc="Buat Rencana Kerja Anggaran" href="/dashboard/perencanaan/rka" color="#8B5CF6" />
                <QuickAction icon="📑" label="Input DPA" desc="Buat Dokumen Pelaksanaan" href="/dashboard/perencanaan/dpa" color="#3B82F6" />
              </>
            )}
            {(user.role === "keuangan" || user.role === "bendahara") && (
              <>
                <QuickAction icon="💳" label="Buat SPP" desc="Surat Permintaan Pembayaran" href="/dashboard/penatausahaan/spp" color="#F59E0B" />
                <QuickAction icon="📖" label="Input BKU" desc="Buku Kas Umum" href="/dashboard/penatausahaan/bku" color="#10B981" />
              </>
            )}
            {user.role === "kpa" && (
              <>
                <QuickAction icon="✅" label="Setujui SPP" desc="SPP menunggu persetujuan" href="/dashboard/penatausahaan/spp" color="#10B981" />
                <QuickAction icon="📝" label="Terbitkan SPM" desc="Surat Perintah Membayar" href="/dashboard/penatausahaan/spm" color="#2563EB" />
              </>
            )}
            <QuickAction icon="📊" label="Laporan Realisasi" desc="Lihat progres realisasi" href="/dashboard/pelaporan/realisasi" color="#F43F5E" />
          </div>
        </>
      )}
    </div>
  );
}

function QuickAction({ icon, label, desc, href, color }: {
  icon: string; label: string; desc: string; href: string; color: string;
}) {
  const router = useRouter();
  return (
    <div
      className="card"
      style={{ padding: 16, cursor: "pointer", transition: "all 0.2s ease", borderLeft: `4px solid ${color}` }}
      onClick={() => router.push(href)}
      onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.1)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = ""; }}
    >
      <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A" }}>{label}</div>
      <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 3 }}>{desc}</div>
      <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 4, fontSize: 11, color, fontWeight: 600 }}>
        Buka <ArrowRight size={12} />
      </div>
    </div>
  );
}

// ============================================================
// MAIN DASHBOARD
// ============================================================

export default function DashboardPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) setUser(d.user);
        else router.push("/");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="empty-state" style={{ minHeight: "60vh" }}>
        <div className="loading-spinner" style={{ width: 40, height: 40 }} />
        <p style={{ marginTop: 16, color: "#64748B" }}>Memuat dashboard...</p>
      </div>
    );
  }

  if (!user) return null;

  return user.role === "superadmin"
    ? <DashboardSuperadmin />
    : <DashboardUpt user={user} />;
}
