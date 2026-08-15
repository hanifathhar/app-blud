"use client";

import { useState, useEffect } from "react";
import { Plus, FileCheck } from "lucide-react";

interface SPM {
  id: number;
  no_spm: string | null;
  kd_upt: string;
  jumlah: number | null;
  status: string;
  tgl_spm: string | null;
  tgl_dibuat: string;
  spp: { no_spp: string | null; jenis_spp: string | null; uraian: string | null; jumlah: number | null };
  sp2d: { id: number; status: string; no_sp2d: string | null } | null;
}
interface SPPApproved { id: number; no_spp: string | null; jenis_spp: string | null; uraian: string | null; jumlah: number | null; kd_upt: string; }
interface UserInfo { role: string; kd_upt: string | null; }

const STATUS_BADGE: Record<string, string> = { draft: "badge-draft", diterbitkan: "badge-diterbitkan", ditolak: "badge-ditolak" };
const STATUS_LABEL: Record<string, string> = { draft: "Draft", diterbitkan: "Diterbitkan", ditolak: "Ditolak" };

function formatRupiah(val: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
}

export default function SPMPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [list, setList] = useState<SPM[]>([]);
  const [sppList, setSppList] = useState<SPPApproved[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ spp_id: "", no_spm: "", tgl_spm: "", jumlah: "", keterangan: "" });

  const loadData = () => {
    setLoading(true);
    fetch("/api/penatausahaan/spm").then((r) => r.json()).then((d) => setList(d.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((d) => d.user && setUser(d.user));
    fetch("/api/penatausahaan/spp?status=disetujui").then((r) => r.json()).then((d) => setSppList(d.data || []));
  }, []);
  useEffect(() => { if (user) loadData(); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const spp = sppList.find((s) => s.id === parseInt(form.spp_id));
    const res = await fetch("/api/penatausahaan/spm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, spp_id: parseInt(form.spp_id), jumlah: form.jumlah ? parseFloat(form.jumlah) : spp?.jumlah }),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ spp_id: "", no_spm: "", tgl_spm: "", jumlah: "", keterangan: "" });
      loadData();
    }
    setSubmitting(false);
  };

  const canCreate = user && ["superadmin", "kpa"].includes(user.role);

  // SPP yang sudah disetujui tapi belum ada SPM-nya
  const sppAvailable = sppList.filter((s) => !list.some((m) => m.spp.no_spp === s.no_spp));

  return (
    <div className="animate-fadein">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>📝 Surat Perintah Membayar (SPM)</h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>Penerbitan SPM dari SPP yang telah disetujui</p>
        </div>
        {canCreate && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)} disabled={sppAvailable.length === 0}>
            <Plus size={16} /> Terbitkan SPM
          </button>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 20 }}>
        <div className="stat-card" style={{ padding: "14px 16px" }}>
          <div style={{ fontSize: 22, fontWeight: 800 }}>{list.length}</div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>Total SPM</div>
        </div>
        <div className="stat-card" style={{ padding: "14px 16px" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#4338CA" }}>{list.filter((s) => s.status === "diterbitkan").length}</div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>Diterbitkan</div>
        </div>
        <div className="stat-card" style={{ padding: "14px 16px" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#10B981" }}>
            {formatRupiah(list.filter((s) => s.status === "diterbitkan").reduce((x, s) => x + (s.jumlah || 0), 0))}
          </div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>Total Nilai SPM</div>
        </div>
        <div className="stat-card" style={{ padding: "14px 16px" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#F59E0B" }}>{sppAvailable.length}</div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>SPP Siap Proses</div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <div className="modal-header">
              <span style={{ fontSize: 16, fontWeight: 700 }}>📝 Terbitkan SPM</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: "grid", gap: 14 }}>
                <div>
                  <label className="form-label">Pilih SPP yang Disetujui *</label>
                  <select className="form-select" required value={form.spp_id} onChange={(e) => {
                    const spp = sppAvailable.find((s) => s.id === parseInt(e.target.value));
                    setForm({ ...form, spp_id: e.target.value, jumlah: spp?.jumlah ? String(spp.jumlah) : "" });
                  }}>
                    <option value="">-- Pilih SPP --</option>
                    {sppAvailable.map((s) => (
                      <option key={s.id} value={s.id}>{s.no_spp || `SPP-${s.id}`} — [{s.jenis_spp}] {formatRupiah(s.jumlah || 0)}</option>
                    ))}
                  </select>
                </div>
                {form.spp_id && sppAvailable.find((s) => s.id === parseInt(form.spp_id)) && (
                  <div style={{ padding: 12, background: "#DBEAFE", borderRadius: 9, fontSize: 12.5, color: "#1D4ED8" }}>
                    📋 {sppAvailable.find((s) => s.id === parseInt(form.spp_id))?.uraian}
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label className="form-label">Nomor SPM</label>
                    <input className="form-input" value={form.no_spm} onChange={(e) => setForm({ ...form, no_spm: e.target.value })} placeholder="SPM-001/2025" />
                  </div>
                  <div>
                    <label className="form-label">Tanggal SPM</label>
                    <input className="form-input" type="date" value={form.tgl_spm} onChange={(e) => setForm({ ...form, tgl_spm: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Jumlah (Rp)</label>
                  <input className="form-input" type="number" value={form.jumlah} onChange={(e) => setForm({ ...form, jumlah: e.target.value })} placeholder="Otomatis dari SPP" />
                </div>
                <div>
                  <label className="form-label">Keterangan</label>
                  <textarea className="form-textarea" value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} rows={2} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <span className="loading-spinner" /> : <FileCheck size={15} />}
                  {submitting ? "Menerbitkan..." : "Terbitkan SPM"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabel */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Daftar SPM</span>
          <span style={{ fontSize: 12, color: "#94A3B8" }}>{list.length} dokumen</span>
        </div>
        {loading ? (
          <div className="empty-state" style={{ padding: 48 }}><div className="loading-spinner" /></div>
        ) : list.length === 0 ? (
          <div className="empty-state" style={{ padding: 48 }}>
            <div className="empty-state-icon">📝</div>
            <p style={{ fontWeight: 600 }}>Belum ada SPM</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>SPP yang sudah disetujui dapat diproses menjadi SPM</p>
          </div>
        ) : (
          <div className="tbl-wrap" style={{ borderRadius: 0 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>No. SPM</th>
                  <th>Referensi SPP</th>
                  <th>Uraian</th>
                  <th style={{ textAlign: "right" }}>Jumlah</th>
                  <th>Tanggal</th>
                  <th>Status</th>
                  <th>SP2D</th>
                </tr>
              </thead>
              <tbody>
                {list.map((spm) => (
                  <tr key={spm.id}>
                    <td style={{ fontWeight: 600, color: "#4338CA" }}>{spm.no_spm || `SPM-${spm.id}`}</td>
                    <td style={{ fontSize: 12.5 }}>
                      <div style={{ fontWeight: 600 }}>{spm.spp.no_spp || "-"}</div>
                      <div style={{ color: "#94A3B8" }}>[{spm.spp.jenis_spp}]</div>
                    </td>
                    <td style={{ maxWidth: 220, fontSize: 12.5 }}>{spm.spp.uraian || "-"}</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>{formatRupiah(spm.jumlah || 0)}</td>
                    <td style={{ fontSize: 12, color: "#94A3B8" }}>{spm.tgl_spm ? new Date(spm.tgl_spm).toLocaleDateString("id-ID") : "-"}</td>
                    <td><span className={`badge ${STATUS_BADGE[spm.status]}`}>{STATUS_LABEL[spm.status]}</span></td>
                    <td>
                      {spm.sp2d ? (
                        <span className={`badge ${spm.sp2d.status === "cair" ? "badge-disetujui" : "badge-diajukan"}`}>
                          SP2D {spm.sp2d.status}
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: "#94A3B8" }}>Belum ada</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
