"use client";

import { useState, useEffect } from "react";
import { Plus, Send, CheckCircle, XCircle, ShieldCheck } from "lucide-react";

interface SPP {
  id: number;
  no_spp: string | null;
  kd_upt: string;
  jenis_spp: string | null;
  uraian: string | null;
  jumlah: number | null;
  status: string;
  tgl_spp: string | null;
  tgl_dibuat: string;
  dpa: { no_dpa: string; nm_kegiatan: string } | null;
  spm: { id: number; status: string; no_spm: string | null } | null;
}
interface DPAItem { id: number; no_dpa: string | null; nm_kegiatan: string | null; pagu: number | null; kd_upt: string; }
interface UserInfo { role: string; kd_upt: string | null; }

const JENIS_SPP = ["UP", "GU", "TU", "LS"];
const STATUS_BADGE: Record<string, string> = {
  draft: "badge-draft", diajukan: "badge-diajukan",
  diverifikasi: "badge-diverifikasi", disetujui: "badge-disetujui", ditolak: "badge-ditolak",
};
const STATUS_LABEL: Record<string, string> = {
  draft: "Draft", diajukan: "Diajukan", diverifikasi: "Diverifikasi", disetujui: "Disetujui", ditolak: "Ditolak",
};

function formatRupiah(val: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
}

export default function SPPPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [list, setList] = useState<SPP[]>([]);
  const [dpaList, setDpaList] = useState<DPAItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    no_spp: "", dpa_id: "", jenis_spp: "UP", uraian: "",
    jumlah: "", tgl_spp: "", keterangan: "",
  });

  const loadData = () => {
    setLoading(true);
    const q = statusFilter ? `?status=${statusFilter}` : "";
    fetch(`/api/penatausahaan/spp${q}`)
      .then((r) => r.json())
      .then((d) => setList(d.data || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((d) => d.user && setUser(d.user));
    fetch("/api/perencanaan/dpa?status=disetujui").then((r) => r.json()).then((d) => setDpaList(d.data || []));
  }, []);

  useEffect(() => { if (user) loadData(); }, [user, statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/penatausahaan/spp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, jumlah: parseFloat(form.jumlah) }),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ no_spp: "", dpa_id: "", jenis_spp: "UP", uraian: "", jumlah: "", tgl_spp: "", keterangan: "" });
      loadData();
    }
    setSubmitting(false);
  };

  const doAction = async (id: number, action: string, keterangan?: string) => {
    await fetch("/api/penatausahaan/spp", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, keterangan }),
    });
    loadData();
  };

  const canCreate = user && ["superadmin", "keuangan", "bendahara"].includes(user.role);
  const canVerify = user && ["superadmin", "keuangan"].includes(user.role);
  const canApprove = user && ["superadmin", "kpa"].includes(user.role);

  return (
    <div className="animate-fadein">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>💳 Surat Permintaan Pembayaran (SPP)</h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>Input dan kelola SPP — UP, GU, TU, LS</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <select className="form-select" style={{ width: 160 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Semua Status</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          {canCreate && (
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={16} /> Buat SPP
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 20 }}>
        {Object.entries(STATUS_LABEL).map(([k, v]) => (
          <div key={k} className="stat-card" style={{ padding: "12px 14px", cursor: "pointer" }} onClick={() => setStatusFilter(statusFilter === k ? "" : k)}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A" }}>{list.filter((s) => s.status === k).length}</div>
            <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>SPP {v}</div>
          </div>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <div className="modal-header">
              <span style={{ fontSize: 16, fontWeight: 700 }}>💳 Buat SPP Baru</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: "grid", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label className="form-label">Nomor SPP</label>
                    <input className="form-input" value={form.no_spp} onChange={(e) => setForm({ ...form, no_spp: e.target.value })} placeholder="SPP-001/2025" />
                  </div>
                  <div>
                    <label className="form-label">Jenis SPP *</label>
                    <select className="form-select" value={form.jenis_spp} onChange={(e) => setForm({ ...form, jenis_spp: e.target.value })}>
                      {JENIS_SPP.map((j) => <option key={j} value={j}>{j}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="form-label">Referensi DPA</label>
                  <select className="form-select" value={form.dpa_id} onChange={(e) => setForm({ ...form, dpa_id: e.target.value })}>
                    <option value="">-- Pilih DPA (opsional) --</option>
                    {dpaList.map((d) => (
                      <option key={d.id} value={d.id}>{d.no_dpa || `DPA-${d.id}`} — {d.nm_kegiatan}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Uraian Pembayaran *</label>
                  <textarea className="form-textarea" required value={form.uraian} onChange={(e) => setForm({ ...form, uraian: e.target.value })} placeholder="Pembayaran untuk..." rows={2} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label className="form-label">Jumlah (Rp) *</label>
                    <input className="form-input" type="number" required value={form.jumlah} onChange={(e) => setForm({ ...form, jumlah: e.target.value })} placeholder="0" />
                  </div>
                  <div>
                    <label className="form-label">Tanggal SPP</label>
                    <input className="form-input" type="date" value={form.tgl_spp} onChange={(e) => setForm({ ...form, tgl_spp: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Keterangan</label>
                  <textarea className="form-textarea" value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} rows={2} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <span className="loading-spinner" /> : <Plus size={15} />}
                  {submitting ? "Menyimpan..." : "Simpan SPP"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabel */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Daftar SPP</span>
          <span style={{ fontSize: 12, color: "#94A3B8" }}>{list.length} dokumen</span>
        </div>
        {loading ? (
          <div className="empty-state" style={{ padding: 48 }}><div className="loading-spinner" /></div>
        ) : list.length === 0 ? (
          <div className="empty-state" style={{ padding: 48 }}>
            <div className="empty-state-icon">💳</div>
            <p style={{ fontWeight: 600 }}>Belum ada SPP</p>
          </div>
        ) : (
          <div className="tbl-wrap" style={{ borderRadius: 0 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>No. SPP</th>
                  <th>Jenis</th>
                  <th>Uraian</th>
                  <th>DPA</th>
                  <th style={{ textAlign: "right" }}>Jumlah</th>
                  <th>Tanggal</th>
                  <th>Status</th>
                  <th>SPM</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {list.map((spp) => (
                  <tr key={spp.id}>
                    <td style={{ fontWeight: 600, color: "#2563EB" }}>{spp.no_spp || `SPP-${spp.id}`}</td>
                    <td>
                      <span className="badge badge-diajukan" style={{ background: "#EDE9FE", color: "#6D28D9" }}>{spp.jenis_spp}</span>
                    </td>
                    <td style={{ maxWidth: 220, fontSize: 12.5 }}>{spp.uraian || "-"}</td>
                    <td style={{ fontSize: 12, color: "#64748B" }}>{spp.dpa?.no_dpa || "-"}</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>{formatRupiah(spp.jumlah || 0)}</td>
                    <td style={{ fontSize: 12, color: "#94A3B8" }}>{spp.tgl_spp ? new Date(spp.tgl_spp).toLocaleDateString("id-ID") : "-"}</td>
                    <td><span className={`badge ${STATUS_BADGE[spp.status]}`}>{STATUS_LABEL[spp.status]}</span></td>
                    <td>
                      {spp.spm ? (
                        <span className={`badge ${spp.spm.status === "diterbitkan" ? "badge-disetujui" : "badge-draft"}`}>
                          SPM {spp.spm.status}
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: "#94A3B8" }}>-</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        {spp.status === "draft" && canCreate && (
                          <button className="btn btn-outline btn-sm" onClick={() => doAction(spp.id, "ajukan")}><Send size={12} /> Ajukan</button>
                        )}
                        {spp.status === "diajukan" && canVerify && (
                          <button className="btn btn-warning btn-sm" onClick={() => doAction(spp.id, "verifikasi")}><ShieldCheck size={12} /> Verifikasi</button>
                        )}
                        {spp.status === "diverifikasi" && canApprove && (
                          <>
                            <button className="btn btn-success btn-sm" onClick={() => doAction(spp.id, "setujui")}><CheckCircle size={12} /></button>
                            <button className="btn btn-danger btn-sm" onClick={() => doAction(spp.id, "tolak", "Perlu revisi")}><XCircle size={12} /></button>
                          </>
                        )}
                      </div>
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
