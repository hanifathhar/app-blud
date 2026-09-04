"use client";

import { useState, useEffect } from "react";
import { Plus, CheckCircle, XCircle, Send, ChevronDown, ChevronUp, FileText } from "lucide-react";

interface DPA {
  id: number;
  no_dpa: string | null;
  kd_upt: string;
  nm_kegiatan: string | null;
  pagu: number | null;
  status: string;
  jenis: string;
  tgl_dibuat: string;
  tahun: { tahun: number };
  rincian: Array<{ id: number; uraian: string | null; pagu: number | null; realisasi: number | null }>;
  _count: { spp: number };
}

interface TahunAnggaran { id: number; tahun: number; status: string; }
interface UserInfo { role: string; kd_upt: string | null; }

const STATUS_BADGE: Record<string, string> = { draft: "badge-draft", diajukan: "badge-diajukan", disetujui: "badge-disetujui", ditolak: "badge-ditolak" };
const STATUS_LABEL: Record<string, string> = { draft: "Draft", diajukan: "Diajukan", disetujui: "Disetujui", ditolak: "Ditolak" };

function formatRupiah(val: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
}

export default function DPAPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [list, setList] = useState<DPA[]>([]);
  const [tahunName, setTahunName] = useState("");
  const [selectedTahun, setSelectedTahun] = useState<number | "">("");
  const [selectedJenis, setSelectedJenis] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    no_dpa: "", tahun_id: "", nm_kegiatan: "",
    kd_program: "", kd_kegiatan: "", pagu: "",
    jenis: "murni", keterangan: "",
  });

  const loadData = () => {
    const params = new URLSearchParams();
    if (selectedTahun) params.set("tahun_id", String(selectedTahun));
    if (selectedJenis) params.set("jenis", selectedJenis);
    setLoading(true);
    fetch(`/api/perencanaan/dpa?${params}`)
      .then((r) => r.json())
      .then((d) => setList(d.data || []))
      .finally(() => setLoading(false));
  };

  const [tahunList, setTahunList] = useState<TahunAnggaran[]>([]);
  
  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((d) => d.user && setUser(d.user));
    fetch("/api/master/tahun").then((r) => r.json()).then((d) => setTahunList(d.data || []));
    const tId = localStorage.getItem("tahunAnggaran");
    const tName = localStorage.getItem("tahunName");
    if (tId) setSelectedTahun(parseInt(tId));
    if (tName) setTahunName(tName);
  }, []);

  useEffect(() => { if (user) loadData(); }, [user, selectedTahun, selectedJenis]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/perencanaan/dpa", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, tahun_id: parseInt(form.tahun_id), pagu: parseFloat(form.pagu) }),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ no_dpa: "", tahun_id: "", nm_kegiatan: "", kd_program: "", kd_kegiatan: "", pagu: "", jenis: "murni", keterangan: "" });
      loadData();
    }
    setSubmitting(false);
  };

  const doAction = async (id: number, action: string, keterangan?: string) => {
    await fetch("/api/perencanaan/dpa", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, keterangan }),
    });
    loadData();
  };

  const canCreate = user && ["superadmin", "perencana"].includes(user.role);
  const canApprove = user && ["superadmin", "kpa"].includes(user.role);

  // Summary
  const totalPagu = list.reduce((s, d) => s + (d.pagu || 0), 0);
  const totalDisetujui = list.filter((d) => d.status === "disetujui").reduce((s, d) => s + (d.pagu || 0), 0);

  return (
    <div className="animate-fadein">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>📑 Dokumen Pelaksanaan Anggaran (DPA)</h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>Pengelolaan DPA dan alokasi anggaran per kegiatan</p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <div style={{ background: "#F1F5F9", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, color: "#475569", border: "1px solid #E2E8F0" }}>
            TA {tahunName || selectedTahun}
          </div>
          <select className="form-select" style={{ width: 130 }} value={selectedJenis} onChange={(e) => setSelectedJenis(e.target.value)}>
            <option value="">Semua Jenis</option>
            <option value="murni">Murni</option>
            <option value="perubahan">Perubahan</option>
          </select>
          {canCreate && (
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={16} /> Buat DPA
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Total DPA", value: `${list.length} dok`, color: "#2563EB" },
          { label: "Total Pagu", value: formatRupiah(totalPagu), color: "#10B981" },
          { label: "DPA Disetujui", value: formatRupiah(totalDisetujui), color: "#8B5CF6" },
          { label: "Menunggu Persetujuan", value: `${list.filter((d) => d.status === "diajukan").length} dok`, color: "#F59E0B" },
        ].map((s) => (
          <div key={s.label} className="stat-card" style={{ padding: "14px 16px" }}>
            <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal" style={{ maxWidth: 620 }}>
            <div className="modal-header">
              <span style={{ fontSize: 16, fontWeight: 700 }}>📑 Buat DPA Baru</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: "grid", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label className="form-label">Nomor DPA</label>
                    <input className="form-input" value={form.no_dpa} onChange={(e) => setForm({ ...form, no_dpa: e.target.value })} placeholder="DPA-001/2025" />
                  </div>
                  <div>
                    <label className="form-label">Tahun Anggaran *</label>
                    <select className="form-select" required value={form.tahun_id} onChange={(e) => setForm({ ...form, tahun_id: e.target.value })}>
                      <option value="">-- Pilih Tahun --</option>
                      {tahunList.filter((t) => t.status === "aktif").map((t) => <option key={t.id} value={t.id}>{t.tahun}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="form-label">Nama Kegiatan *</label>
                  <input className="form-input" required value={form.nm_kegiatan} onChange={(e) => setForm({ ...form, nm_kegiatan: e.target.value })} placeholder="Uraian kegiatan" />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <div>
                    <label className="form-label">Kode Program</label>
                    <input className="form-input" value={form.kd_program} onChange={(e) => setForm({ ...form, kd_program: e.target.value })} placeholder="Kd. Program" />
                  </div>
                  <div>
                    <label className="form-label">Kode Kegiatan</label>
                    <input className="form-input" value={form.kd_kegiatan} onChange={(e) => setForm({ ...form, kd_kegiatan: e.target.value })} placeholder="Kd. Kegiatan" />
                  </div>
                  <div>
                    <label className="form-label">Jenis DPA *</label>
                    <select className="form-select" value={form.jenis} onChange={(e) => setForm({ ...form, jenis: e.target.value })}>
                      <option value="murni">Murni</option>
                      <option value="perubahan">Perubahan</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="form-label">Pagu Anggaran (Rp) *</label>
                  <input className="form-input" type="number" required value={form.pagu} onChange={(e) => setForm({ ...form, pagu: e.target.value })} placeholder="0" />
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
                  {submitting ? "Menyimpan..." : "Simpan DPA"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tabel */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Daftar DPA</span>
          <span style={{ fontSize: 12, color: "#94A3B8" }}>{list.length} dokumen</span>
        </div>
        {loading ? (
          <div className="empty-state" style={{ padding: 48 }}><div className="loading-spinner" /></div>
        ) : list.length === 0 ? (
          <div className="empty-state" style={{ padding: 48 }}>
            <div className="empty-state-icon">📑</div>
            <p style={{ fontWeight: 600 }}>Belum ada DPA</p>
          </div>
        ) : (
          <div className="tbl-wrap" style={{ borderRadius: 0 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th>No. DPA</th>
                  <th>Kegiatan</th>
                  <th>Tahun</th>
                  <th>Jenis</th>
                  <th style={{ textAlign: "right" }}>Pagu</th>
                  <th>Realisasi</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {list.map((dpa) => {
                  const totalReal = dpa.rincian.reduce((s, r) => s + (r.realisasi || 0), 0);
                  const pct = dpa.pagu && dpa.pagu > 0 ? (totalReal / dpa.pagu) * 100 : 0;
                  const pctColor = pct >= 80 ? "#10B981" : pct >= 50 ? "#F59E0B" : "#F43F5E";
                  return (
                    <>
                      <tr key={dpa.id}>
                        <td style={{ fontWeight: 600, color: "#2563EB" }}>{dpa.no_dpa || `DPA-${dpa.id}`}</td>
                        <td style={{ maxWidth: 240 }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{dpa.nm_kegiatan || "-"}</div>
                          <div style={{ fontSize: 11, color: "#94A3B8" }}>{dpa._count.spp} SPP terkait</div>
                        </td>
                        <td>{dpa.tahun?.tahun}</td>
                        <td>
                          <span className={`badge ${dpa.jenis === "perubahan" ? "badge-diajukan" : "badge-draft"}`}>
                            {dpa.jenis}
                          </span>
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>{formatRupiah(dpa.pagu || 0)}</td>
                        <td style={{ minWidth: 120 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <div className="progress-bar" style={{ flex: 1 }}>
                              <div className="progress-fill" style={{ width: `${pct}%`, background: pctColor }} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: pctColor, width: 36 }}>{pct.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td><span className={`badge ${STATUS_BADGE[dpa.status]}`}>{STATUS_LABEL[dpa.status]}</span></td>
                        <td>
                          <div style={{ display: "flex", gap: 5 }}>
                            <button className="btn btn-ghost btn-sm" onClick={() => setExpandedId(expandedId === dpa.id ? null : dpa.id)}>
                              {expandedId === dpa.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                            {dpa.status === "draft" && canCreate && (
                              <button className="btn btn-outline btn-sm" onClick={() => doAction(dpa.id, "ajukan")}>
                                <Send size={12} /> Ajukan
                              </button>
                            )}
                            {dpa.status === "diajukan" && canApprove && (
                              <>
                                <button className="btn btn-success btn-sm" onClick={() => doAction(dpa.id, "setujui")}><CheckCircle size={12} /></button>
                                <button className="btn btn-danger btn-sm" onClick={() => doAction(dpa.id, "tolak", "Perlu revisi")}><XCircle size={12} /></button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                      {expandedId === dpa.id && (
                        <tr key={`${dpa.id}-detail`}>
                          <td colSpan={8} style={{ background: "#F8FAFC", padding: "12px 20px" }}>
                            <p style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 8 }}>Rincian DPA:</p>
                            {dpa.rincian.length === 0 ? (
                              <p style={{ fontSize: 12, color: "#94A3B8" }}>Belum ada rincian</p>
                            ) : (
                              <table style={{ width: "100%", fontSize: 12 }}>
                                <thead>
                                  <tr>
                                    {["Uraian", "Pagu", "Realisasi", "Sisa", "%"].map((h) => (
                                      <th key={h} style={{ textAlign: h === "Uraian" ? "left" : "right", color: "#94A3B8", padding: "4px 8px" }}>{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {dpa.rincian.map((r) => {
                                    const sisa = (r.pagu || 0) - (r.realisasi || 0);
                                    const rPct = r.pagu && r.pagu > 0 ? ((r.realisasi || 0) / r.pagu) * 100 : 0;
                                    return (
                                      <tr key={r.id}>
                                        <td style={{ padding: "4px 8px" }}>{r.uraian || "-"}</td>
                                        <td style={{ textAlign: "right", padding: "4px 8px" }}>{formatRupiah(r.pagu || 0)}</td>
                                        <td style={{ textAlign: "right", padding: "4px 8px", color: "#10B981" }}>{formatRupiah(r.realisasi || 0)}</td>
                                        <td style={{ textAlign: "right", padding: "4px 8px", color: sisa < 0 ? "#F43F5E" : "#64748B" }}>{formatRupiah(sisa)}</td>
                                        <td style={{ textAlign: "right", padding: "4px 8px", fontWeight: 700 }}>{rPct.toFixed(1)}%</td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
