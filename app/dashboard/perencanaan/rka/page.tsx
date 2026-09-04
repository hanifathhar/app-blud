"use client";

import { useState, useEffect } from "react";
import { Plus, RefreshCw, Eye, CheckCircle, XCircle, Send, ChevronUp, ChevronDown } from "lucide-react";

interface RKA {
  id: number;
  no_rka: string | null;
  kd_upt: string;
  nm_kegiatan: string | null;
  kd_program: string | null;
  pagu: number | null;
  status: string;
  tgl_dibuat: string;
  tgl_disetujui: string | null;
  tahun: { tahun: number };
  rincian: Array<{ id: number; uraian: string | null; jumlah: number | null }>;
}

interface TahunAnggaran { id: number; tahun: number; status: string; }
interface UserInfo { role: string; kd_upt: string | null; }

const STATUS_BADGE: Record<string, string> = {
  draft: "badge-draft",
  diajukan: "badge-diajukan",
  disetujui: "badge-disetujui",
  ditolak: "badge-ditolak",
};

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  diajukan: "Diajukan",
  disetujui: "Disetujui",
  ditolak: "Ditolak",
};

function formatRupiah(val: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
}

export default function RKAPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [list, setList] = useState<RKA[]>([]);
  const [tahunName, setTahunName] = useState("");
  const [selectedTahun, setSelectedTahun] = useState<number | "">("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    no_rka: "",
    tahun_id: "",
    kd_program: "",
    kd_kegiatan: "",
    nm_kegiatan: "",
    pagu: "",
    keterangan: "",
  });

  const [tahunList, setTahunList] = useState<TahunAnggaran[]>([]);

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((d) => d.user && setUser(d.user));
    fetch("/api/master/tahun").then((r) => r.json()).then((d) => setTahunList(d.data || []));
    const tId = localStorage.getItem("tahunAnggaran");
    const tName = localStorage.getItem("tahunName");
    if (tId) setSelectedTahun(parseInt(tId));
    if (tName) setTahunName(tName);
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const q = selectedTahun ? `?tahun_id=${selectedTahun}` : "";
    fetch(`/api/perencanaan/rka${q}`)
      .then((r) => r.json())
      .then((d) => setList(d.data || []))
      .finally(() => setLoading(false));
  }, [user, selectedTahun]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/perencanaan/rka", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, tahun_id: parseInt(form.tahun_id), pagu: parseFloat(form.pagu) }),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ no_rka: "", tahun_id: "", kd_program: "", kd_kegiatan: "", nm_kegiatan: "", pagu: "", keterangan: "" });
      const q = selectedTahun ? `?tahun_id=${selectedTahun}` : "";
      fetch(`/api/perencanaan/rka${q}`).then((r) => r.json()).then((d) => setList(d.data || []));
    }
    setSubmitting(false);
  };

  const doAction = async (id: number, action: string, keterangan?: string) => {
    await fetch("/api/perencanaan/rka", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, keterangan }),
    });
    const q = selectedTahun ? `?tahun_id=${selectedTahun}` : "";
    fetch(`/api/perencanaan/rka${q}`).then((r) => r.json()).then((d) => setList(d.data || []));
  };

  const canCreate = user && ["superadmin", "perencana"].includes(user.role);
  const canApprove = user && ["superadmin", "kpa"].includes(user.role);

  return (
    <div className="animate-fadein">
      {/* Page Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>📋 Rencana Kerja Anggaran (RKA)</h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>Kelola dokumen perencanaan anggaran UPT</p>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ background: "#F1F5F9", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, color: "#475569", border: "1px solid #E2E8F0" }}>
            TA {tahunName || selectedTahun}
          </div>
          {canCreate && (
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={16} /> Buat RKA
            </button>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal" style={{ maxWidth: 600 }}>
            <div className="modal-header">
              <span style={{ fontSize: 16, fontWeight: 700 }}>📋 Buat RKA Baru</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: "grid", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label className="form-label">Nomor RKA</label>
                    <input className="form-input" value={form.no_rka} onChange={(e) => setForm({ ...form, no_rka: e.target.value })} placeholder="Contoh: RKA-001/2025" />
                  </div>
                  <div>
                    <label className="form-label">Tahun Anggaran *</label>
                    <select className="form-select" required value={form.tahun_id} onChange={(e) => setForm({ ...form, tahun_id: e.target.value })}>
                      <option value="">-- Pilih Tahun --</option>
                      {tahunList.filter((t) => t.status === "aktif").map((t) => (
                        <option key={t.id} value={t.id}>{t.tahun}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="form-label">Nama Kegiatan *</label>
                  <input className="form-input" required value={form.nm_kegiatan} onChange={(e) => setForm({ ...form, nm_kegiatan: e.target.value })} placeholder="Uraian kegiatan" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label className="form-label">Kode Program</label>
                    <input className="form-input" value={form.kd_program} onChange={(e) => setForm({ ...form, kd_program: e.target.value })} placeholder="Kd. Program" />
                  </div>
                  <div>
                    <label className="form-label">Kode Kegiatan</label>
                    <input className="form-input" value={form.kd_kegiatan} onChange={(e) => setForm({ ...form, kd_kegiatan: e.target.value })} placeholder="Kd. Kegiatan" />
                  </div>
                </div>
                <div>
                  <label className="form-label">Pagu Anggaran (Rp) *</label>
                  <input className="form-input" type="number" required value={form.pagu} onChange={(e) => setForm({ ...form, pagu: e.target.value })} placeholder="0" />
                </div>
                <div>
                  <label className="form-label">Keterangan</label>
                  <textarea className="form-textarea" value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} placeholder="Keterangan tambahan..." rows={2} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <span className="loading-spinner" /> : <Plus size={15} />}
                  {submitting ? "Menyimpan..." : "Simpan RKA"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabel RKA */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Daftar RKA</span>
          <span style={{ fontSize: 12, color: "#94A3B8" }}>{list.length} dokumen</span>
        </div>
        {loading ? (
          <div className="empty-state" style={{ padding: 48 }}><div className="loading-spinner" /><p style={{ marginTop: 12 }}>Memuat...</p></div>
        ) : list.length === 0 ? (
          <div className="empty-state" style={{ padding: 48 }}>
            <div className="empty-state-icon">📋</div>
            <p style={{ fontWeight: 600 }}>Belum ada data RKA</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>Klik "Buat RKA" untuk menambahkan</p>
          </div>
        ) : (
          <div className="tbl-wrap" style={{ borderRadius: 0 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>No. RKA</th>
                  <th>Kegiatan</th>
                  <th>Tahun</th>
                  <th style={{ textAlign: "right" }}>Pagu</th>
                  <th>Status</th>
                  <th>Tanggal</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {list.map((rka) => (
                  <>
                    <tr key={rka.id}>
                      <td style={{ fontWeight: 600, color: "#2563EB" }}>{rka.no_rka || `RKA-${rka.id}`}</td>
                      <td style={{ maxWidth: 260 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>{rka.nm_kegiatan || "-"}</div>
                        {rka.kd_program && <div style={{ fontSize: 11, color: "#94A3B8" }}>{rka.kd_program}</div>}
                      </td>
                      <td>{rka.tahun?.tahun}</td>
                      <td style={{ textAlign: "right", fontWeight: 700 }}>{formatRupiah(rka.pagu || 0)}</td>
                      <td>
                        <span className={`badge ${STATUS_BADGE[rka.status] || "badge-draft"}`}>
                          {STATUS_LABEL[rka.status] || rka.status}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: "#94A3B8" }}>
                        {new Date(rka.tgl_dibuat).toLocaleDateString("id-ID")}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setExpandedId(expandedId === rka.id ? null : rka.id)}
                          >
                            {expandedId === rka.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                          {rka.status === "draft" && canCreate && (
                            <button className="btn btn-outline btn-sm" onClick={() => doAction(rka.id, "ajukan")}>
                              <Send size={12} /> Ajukan
                            </button>
                          )}
                          {rka.status === "diajukan" && canApprove && (
                            <>
                              <button className="btn btn-success btn-sm" onClick={() => doAction(rka.id, "setujui")}>
                                <CheckCircle size={12} /> Setujui
                              </button>
                              <button className="btn btn-danger btn-sm" onClick={() => doAction(rka.id, "tolak", "Perlu perbaikan")}>
                                <XCircle size={12} /> Tolak
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedId === rka.id && rka.rincian.length > 0 && (
                      <tr key={`${rka.id}-detail`}>
                        <td colSpan={7} style={{ padding: 0, background: "#F8FAFC" }}>
                          <div style={{ padding: "12px 20px" }}>
                            <p style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8 }}>Rincian Anggaran:</p>
                            <table style={{ width: "100%", fontSize: 12 }}>
                              <thead>
                                <tr>
                                  <th style={{ textAlign: "left", color: "#94A3B8", padding: "4px 8px" }}>Uraian</th>
                                  <th style={{ textAlign: "right", color: "#94A3B8", padding: "4px 8px" }}>Jumlah</th>
                                </tr>
                              </thead>
                              <tbody>
                                {rka.rincian.map((r) => (
                                  <tr key={r.id}>
                                    <td style={{ padding: "4px 8px", color: "#475569" }}>{r.uraian || "-"}</td>
                                    <td style={{ padding: "4px 8px", textAlign: "right", fontWeight: 600 }}>{formatRupiah(r.jumlah || 0)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
