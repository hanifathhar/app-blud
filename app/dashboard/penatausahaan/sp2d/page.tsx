"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";

interface SP2D {
  id: number;
  no_sp2d: string | null;
  kd_upt: string;
  jumlah: number | null;
  bank: string | null;
  no_rekening: string | null;
  status: string;
  tgl_sp2d: string | null;
  tgl_dibuat: string;
  spm: {
    no_spm: string | null;
    spp: { no_spp: string | null; jenis_spp: string | null; uraian: string | null };
  };
}
interface SPMItem { id: number; no_spm: string | null; jumlah: number | null; kd_upt: string; spp: { no_spp: string | null; uraian: string | null }; }
interface UserInfo { role: string; kd_upt: string | null; }

const STATUS_BADGE: Record<string, string> = { proses: "badge-diajukan", cair: "badge-disetujui", batal: "badge-ditolak" };
const STATUS_LABEL: Record<string, string> = { proses: "Proses", cair: "Cair", batal: "Batal" };

function formatRupiah(val: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
}

export default function SP2DPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [list, setList] = useState<SP2D[]>([]);
  const [spmList, setSpmList] = useState<SPMItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ spm_id: "", no_sp2d: "", tgl_sp2d: "", jumlah: "", bank: "", no_rekening: "", keterangan: "" });

  const loadData = () => {
    setLoading(true);
    fetch("/api/penatausahaan/sp2d").then((r) => r.json()).then((d) => setList(d.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((d) => d.user && setUser(d.user));
    fetch("/api/penatausahaan/spm?status=diterbitkan").then((r) => r.json()).then((d) => setSpmList(d.data || []));
  }, []);
  useEffect(() => { if (user) loadData(); }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/penatausahaan/sp2d", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, spm_id: parseInt(form.spm_id), jumlah: form.jumlah ? parseFloat(form.jumlah) : undefined }),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ spm_id: "", no_sp2d: "", tgl_sp2d: "", jumlah: "", bank: "", no_rekening: "", keterangan: "" });
      loadData();
    }
    setSubmitting(false);
  };

  const updateStatus = async (id: number, status: string) => {
    await fetch("/api/penatausahaan/sp2d", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    loadData();
  };

  const canCreate = user && ["superadmin", "bendahara", "keuangan"].includes(user.role);
  const spmAvailable = spmList.filter((s) => !list.some((d) => d.spm.no_spm === s.no_spm));

  return (
    <div className="animate-fadein">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>🏦 Surat Perintah Pencairan Dana (SP2D)</h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>Pencatatan dan monitoring pencairan dana dari bank</p>
        </div>
        {canCreate && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)} disabled={spmAvailable.length === 0}>
            <Plus size={16} /> Catat SP2D
          </button>
        )}
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 20 }}>
        {Object.entries(STATUS_LABEL).map(([k, v]) => {
          const count = list.filter((s) => s.status === k);
          return (
            <div key={k} className="stat-card" style={{ padding: "14px 16px" }}>
              <div style={{ fontSize: 22, fontWeight: 800 }}>{count.length}</div>
              <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2 }}>{v}</div>
              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                {formatRupiah(count.reduce((s, c) => s + (c.jumlah || 0), 0))}
              </div>
            </div>
          );
        })}
        <div className="stat-card" style={{ padding: "14px 16px" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#10B981" }}>
            {formatRupiah(list.filter((s) => s.status === "cair").reduce((s, c) => s + (c.jumlah || 0), 0))}
          </div>
          <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>Total Dana Cair</div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <div className="modal-header">
              <span style={{ fontSize: 16, fontWeight: 700 }}>🏦 Catat SP2D</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: "grid", gap: 14 }}>
                <div>
                  <label className="form-label">Referensi SPM *</label>
                  <select className="form-select" required value={form.spm_id} onChange={(e) => {
                    const spm = spmAvailable.find((s) => s.id === parseInt(e.target.value));
                    setForm({ ...form, spm_id: e.target.value, jumlah: spm?.jumlah ? String(spm.jumlah) : "" });
                  }}>
                    <option value="">-- Pilih SPM --</option>
                    {spmAvailable.map((s) => (
                      <option key={s.id} value={s.id}>{s.no_spm || `SPM-${s.id}`} — {formatRupiah(s.jumlah || 0)}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label className="form-label">Nomor SP2D</label>
                    <input className="form-input" value={form.no_sp2d} onChange={(e) => setForm({ ...form, no_sp2d: e.target.value })} placeholder="SP2D-001/2025" />
                  </div>
                  <div>
                    <label className="form-label">Tanggal SP2D</label>
                    <input className="form-input" type="date" value={form.tgl_sp2d} onChange={(e) => setForm({ ...form, tgl_sp2d: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Jumlah (Rp)</label>
                  <input className="form-input" type="number" value={form.jumlah} onChange={(e) => setForm({ ...form, jumlah: e.target.value })} placeholder="Otomatis dari SPM" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label className="form-label">Nama Bank</label>
                    <input className="form-input" value={form.bank} onChange={(e) => setForm({ ...form, bank: e.target.value })} placeholder="Bank BRI, BNI, dll" />
                  </div>
                  <div>
                    <label className="form-label">Nomor Rekening</label>
                    <input className="form-input" value={form.no_rekening} onChange={(e) => setForm({ ...form, no_rekening: e.target.value })} placeholder="Nomor rekening" />
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
                  {submitting ? "Menyimpan..." : "Simpan SP2D"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabel */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Daftar SP2D</span>
          <span style={{ fontSize: 12, color: "#94A3B8" }}>{list.length} dokumen</span>
        </div>
        {loading ? (
          <div className="empty-state" style={{ padding: 48 }}><div className="loading-spinner" /></div>
        ) : list.length === 0 ? (
          <div className="empty-state" style={{ padding: 48 }}>
            <div className="empty-state-icon">🏦</div>
            <p style={{ fontWeight: 600 }}>Belum ada SP2D</p>
          </div>
        ) : (
          <div className="tbl-wrap" style={{ borderRadius: 0 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>No. SP2D</th>
                  <th>SPM</th>
                  <th>Uraian</th>
                  <th style={{ textAlign: "right" }}>Jumlah</th>
                  <th>Bank</th>
                  <th>Tgl. SP2D</th>
                  <th>Status</th>
                  {canCreate && <th>Aksi</th>}
                </tr>
              </thead>
              <tbody>
                {list.map((sp2d) => (
                  <tr key={sp2d.id}>
                    <td style={{ fontWeight: 600, color: "#2563EB" }}>{sp2d.no_sp2d || `SP2D-${sp2d.id}`}</td>
                    <td style={{ fontSize: 12.5 }}>
                      <div style={{ fontWeight: 600 }}>{sp2d.spm.no_spm || "-"}</div>
                      <div style={{ color: "#94A3B8" }}>[{sp2d.spm.spp.jenis_spp}]</div>
                    </td>
                    <td style={{ maxWidth: 220, fontSize: 12.5 }}>{sp2d.spm.spp.uraian || "-"}</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>{formatRupiah(sp2d.jumlah || 0)}</td>
                    <td style={{ fontSize: 12.5 }}>
                      <div>{sp2d.bank || "-"}</div>
                      {sp2d.no_rekening && <div style={{ fontSize: 11, color: "#94A3B8", fontFamily: "monospace" }}>{sp2d.no_rekening}</div>}
                    </td>
                    <td style={{ fontSize: 12, color: "#94A3B8" }}>
                      {sp2d.tgl_sp2d ? new Date(sp2d.tgl_sp2d).toLocaleDateString("id-ID") : "-"}
                    </td>
                    <td><span className={`badge ${STATUS_BADGE[sp2d.status]}`}>{STATUS_LABEL[sp2d.status]}</span></td>
                    {canCreate && (
                      <td>
                        {sp2d.status === "proses" && (
                          <div style={{ display: "flex", gap: 5 }}>
                            <button className="btn btn-success btn-sm" onClick={() => updateStatus(sp2d.id, "cair")}>✅ Cair</button>
                            <button className="btn btn-danger btn-sm" onClick={() => updateStatus(sp2d.id, "batal")}>Batal</button>
                          </div>
                        )}
                      </td>
                    )}
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
