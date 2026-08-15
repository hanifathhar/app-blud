"use client";

import { useState, useEffect } from "react";
import { Plus, Edit3, X, UserCheck, UserX, Shield, Search, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

interface AdminUser {
  id: number;
  nama: string | null;
  username: string | null;
  level: number | null;
  status: number;
  unit: string | null;
  email: string | null;
  no_telp: string | null;
  tgl_login: string | null;
}
interface UptItem { id: number; kd_upt: string | null; nm_upt: string | null; type: string | null; }

const LEVEL_LABEL: Record<number, string> = {
  1: "🏛️ Superadmin (Dinkes)",
  2: "👑 KPA",
  3: "📋 Perencana",
  4: "💰 Keuangan",
  5: "🏦 Bendahara",
};
const LEVEL_COLOR: Record<number, string> = {
  1: "#10B981", 2: "#2563EB", 3: "#8B5CF6", 4: "#F59E0B", 5: "#F43F5E",
};

export default function PenggunaPage() {
  const [list, setList] = useState<AdminUser[]>([]);
  const [upts, setUpts] = useState<UptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showUptDialog, setShowUptDialog] = useState(false);
  const [uptSearch, setUptSearch] = useState("");
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [filterUpt, setFilterUpt] = useState("");
  const [filterLevel, setFilterLevel] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });

  const [form, setForm] = useState({
    nama: "", username: "", password: "",
    level: "5", unit: "", email: "", no_telp: "", status: "1",
  });

  const loadData = () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      q: searchQuery,
    });
    if (filterUpt) params.append("kd_upt", filterUpt);

    fetch(`/api/admin/users?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        setList(d.data || []);
        if (d.pagination) setPagination(d.pagination);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch("/api/upt?limit=500").then((r) => r.json()).then((d) => setUpts(d.data || []));
  }, []);

  // Debounce pencarian
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1); // Reset halaman ke 1 setiap kali kata kunci berubah
    }, 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => { loadData(); }, [filterUpt, page, limit, searchQuery]);

  const openCreate = () => {
    setEditing(null);
    setForm({ nama: "", username: "", password: "", level: "5", unit: "", email: "", no_telp: "", status: "1" });
    setShowForm(true);
  };

  const openEdit = (u: AdminUser) => {
    setEditing(u);
    setForm({
      nama: u.nama || "", username: u.username || "", password: "",
      level: String(u.level || 5), unit: u.unit || "", email: u.email || "",
      no_telp: u.no_telp || "", status: String(u.status),
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (editing) {
      await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing.id, ...form }),
      });
    } else {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        let errMsg = "Gagal membuat pengguna";
        try {
          const d = await res.json();
          if (d.error) errMsg = d.error;
        } catch (e) {
          console.error("Gagal parse error response:", e);
        }
        alert(errMsg);
        setSubmitting(false);
        return;
      }
    }

    setShowForm(false);
    loadData();
    setSubmitting(false);
  };

  const toggleStatus = async (u: AdminUser) => {
    await fetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: u.id, status: u.status === 1 ? 0 : 1 }),
    });
    loadData();
  };

  const deleteUser = async (u: AdminUser) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus pengguna ${u.nama || u.username}?`)) return;
    try {
      const res = await fetch(`/api/admin/users?id=${u.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Gagal menghapus pengguna");
      }
    } catch (e) {
      alert("Terjadi kesalahan sistem");
    }
    loadData();
  };

  const filtered = list.filter((u) => !filterLevel || String(u.level) === filterLevel);

  return (
    <div className="animate-fadein">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>👥 Manajemen Pengguna</h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>Kelola akun pengguna semua UPT dan Dinkes</p>
        </div>
        {!showForm ? (
          <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Tambah Pengguna</button>
        ) : (
          <button className="btn btn-outline" onClick={() => setShowForm(false)}><ChevronLeft size={16} /> Kembali</button>
        )}
      </div>

      {!showForm && (
        <>
          {/* Summary per level */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
            {Object.entries(LEVEL_LABEL).map(([lv, label]) => {
              const count = list.filter((u) => String(u.level) === lv).length;
              return (
                <div
                  key={lv}
                  className="stat-card"
                  style={{ padding: "12px 14px", cursor: "pointer", borderLeft: `3px solid ${LEVEL_COLOR[parseInt(lv)]}` }}
                  onClick={() => setFilterLevel(filterLevel === lv ? "" : lv)}
                >
                  <div style={{ fontSize: 20, fontWeight: 800, color: LEVEL_COLOR[parseInt(lv)] }}>{count}</div>
                  <div style={{ fontSize: 10.5, color: "#94A3B8", marginTop: 2 }}>{label.replace(/^[^\s]+\s/, "")}</div>
                </div>
              );
            })}
          </div>

          {/* Filters */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
            <div style={{ position: "relative", width: 250 }}>
              <Search style={{ position: "absolute", left: 12, top: 10, color: "#94A3B8" }} size={16} />
              <input
                type="text"
                placeholder="Cari pengguna..."
                className="form-input"
                style={{ paddingLeft: 36, borderRadius: 20 }}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <select className="form-select" style={{ width: 200 }} value={filterUpt} onChange={(e) => { setFilterUpt(e.target.value); setPage(1); }}>
              <option value="">Semua UPT</option>
              <option value="DINKES">Dinas Kesehatan</option>
              {upts.map((u) => <option key={u.id} value={u.kd_upt || ""}>{u.nm_upt}</option>)}
            </select>
            <select className="form-select" style={{ width: 200 }} value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
              <option value="">Semua Level</option>
              {Object.entries(LEVEL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </>
      )}

      {/* Form Card */}
      {showForm && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              {editing ? `✏️ Edit — ${editing.nama}` : "➕ Tambah Pengguna Baru"}
            </span>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="card-body" style={{ display: "grid", gap: 16, padding: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label className="form-label">Nama Lengkap *</label>
                  <input className="form-input" required value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Nama pengguna" />
                </div>
                <div>
                  <label className="form-label">Username *</label>
                  <input className="form-input" required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="username" disabled={!!editing} />
                </div>
              </div>
              <div>
                <label className="form-label">{editing ? "Password Baru (kosongkan jika tidak berubah)" : "Password *"}</label>
                <input
                  className="form-input"
                  type="password"
                  required={!editing}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder={editing ? "Kosongkan jika tidak berubah" : "Minimal 6 karakter"}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label className="form-label">Level / Role *</label>
                  <select className="form-select" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
                    {Object.entries(LEVEL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Unit / UPT</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      className="form-input"
                      readOnly
                      value={form.unit === "DINKES" ? "Dinas Kesehatan" : (upts.find(u => u.kd_upt === form.unit)?.nm_upt || "Semua UPT / Belum Dipilih")}
                      onClick={() => setShowUptDialog(true)}
                      style={{ cursor: "pointer", flex: 1 }}
                    />
                    <button type="button" className="btn btn-outline" onClick={() => setShowUptDialog(true)}>Pilih</button>
                  </div>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@dinkes.go.id" />
                </div>
                <div>
                  <label className="form-label">No. Telepon</label>
                  <input className="form-input" value={form.no_telp} onChange={(e) => setForm({ ...form, no_telp: e.target.value })} placeholder="08xx" />
                </div>
              </div>
              {editing && (
                <div>
                  <label className="form-label">Status Akun</label>
                  <select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="1">Aktif</option>
                    <option value="0">Nonaktif</option>
                  </select>
                </div>
              )}
            </div>
            <div className="card-footer" style={{ padding: "16px 24px", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Batal</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? <span className="loading-spinner" /> : <Shield size={14} />}
                {submitting ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Buat Pengguna"}
              </button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
        <>
          {/* Tabel */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Daftar Pengguna</span>
            </div>
            {loading ? (
              <div className="empty-state" style={{ padding: 48 }}><div className="loading-spinner" /></div>
            ) : filtered.length === 0 ? (
              <div className="empty-state" style={{ padding: 48 }}>
                <div className="empty-state-icon">👥</div>
                <p style={{ fontWeight: 600 }}>Belum ada pengguna</p>
              </div>
            ) : (
              <div className="tbl-wrap" style={{ borderRadius: 0 }}>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th style={{ width: 40, textAlign: "center" }}>No</th>
                      <th>Nama</th>
                      <th>Username</th>
                      <th>Level / Role</th>
                      <th>Unit / UPT</th>
                      <th>Email</th>
                      <th>Login Terakhir</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u, i) => (
                      <tr key={u.id}>
                        <td style={{ textAlign: "center", fontSize: 12, color: "#64748B" }}>{(page - 1) * limit + i + 1}</td>
                        <td style={{ fontWeight: 600 }}>{u.nama || "-"}</td>
                        <td style={{ fontFamily: "monospace", fontSize: 12.5, color: "#475569" }}>{u.username || "-"}</td>
                        <td>
                          <span
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 5,
                              fontSize: 11.5, fontWeight: 600, padding: "3px 10px", borderRadius: 20,
                              background: `${LEVEL_COLOR[u.level || 5]}18`,
                              color: LEVEL_COLOR[u.level || 5],
                            }}
                          >
                            {LEVEL_LABEL[u.level || 5]}
                          </span>
                        </td>
                        <td style={{ fontSize: 12.5, color: "#64748B" }}>
                          {u.unit ? (
                            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              🏥 {upts.find((x) => x.kd_upt === u.unit)?.nm_upt || u.unit}
                            </span>
                          ) : "Dinas Kesehatan"}
                        </td>
                        <td style={{ fontSize: 12, color: "#94A3B8" }}>{u.email || "-"}</td>
                        <td style={{ fontSize: 11.5, color: "#94A3B8" }}>
                          {u.tgl_login ? new Date(u.tgl_login).toLocaleDateString("id-ID") : "Belum"}
                        </td>
                        <td>
                          <span className={`badge ${u.status === 1 ? "badge-disetujui" : "badge-ditolak"}`}>
                            {u.status === 1 ? "Aktif" : "Nonaktif"}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 5 }}>
                            <button className="btn btn-outline btn-sm" onClick={() => openEdit(u)} title="Edit Pengguna">
                              <Edit3 size={12} />
                            </button>
                            <button
                              className={`btn btn-sm ${u.status === 1 ? "btn-warning" : "btn-success"}`}
                              onClick={() => toggleStatus(u)}
                              title={u.status === 1 ? "Nonaktifkan" : "Aktifkan"}
                              style={{
                                background: u.status === 1 ? "#FEF3C7" : "#DCFCE7",
                                color: u.status === 1 ? "#D97706" : "#16A34A",
                                borderColor: u.status === 1 ? "#FDE68A" : "#BBF7D0",
                              }}
                            >
                              {u.status === 1 ? <UserX size={12} /> : <UserCheck size={12} />}
                            </button>
                            <button className="btn btn-sm" style={{ background: "#FEE2E2", color: "#DC2626", borderColor: "#FECACA" }} onClick={() => deleteUser(u)} title="Hapus Pengguna">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Footer */}
            {!loading && filtered.length > 0 && (
              <div className="card-footer" style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderTop: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 13, color: "#64748B" }}>
                  Menampilkan {list.length === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1} sampai {Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total} data
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, color: "#64748B" }}>Baris per halaman:</span>
                    <select
                      className="form-select"
                      style={{ width: 70, padding: "4px 8px", fontSize: 13 }}
                      value={limit}
                      onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                    >
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      className="btn btn-outline"
                      style={{ padding: "6px 10px" }}
                      disabled={pagination.page <= 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{ padding: "6px 10px" }}
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* UPT Modal Dialog */}
      {showUptDialog && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowUptDialog(false)}>
          <div className="modal" style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <span style={{ fontSize: 16, fontWeight: 700 }}>Pilih UPT</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowUptDialog(false)}><X size={16} /></button>
            </div>
            <div className="modal-body" style={{ display: "grid", gap: 14 }}>
              <div style={{ position: "relative" }}>
                <Search style={{ position: "absolute", left: 12, top: 10, color: "#94A3B8" }} size={16} />
                <input
                  className="form-input"
                  placeholder="Cari UPT..."
                  value={uptSearch}
                  onChange={(e) => setUptSearch(e.target.value)}
                  style={{ paddingLeft: 36 }}
                />
              </div>
              <div style={{ maxHeight: 300, overflowY: "auto", border: "1px solid #E2E8F0", borderRadius: 8 }}>
                <div
                  style={{ padding: "10px 12px", borderBottom: "1px solid #E2E8F0", cursor: "pointer", background: form.unit === "DINKES" ? "#F1F5F9" : "transparent" }}
                  onClick={() => { setForm({ ...form, unit: "DINKES" }); setShowUptDialog(false); }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13, color: "#0F172A" }}>Dinas Kesehatan</div>
                </div>
                {upts.filter(u => u.nm_upt?.toLowerCase().includes(uptSearch.toLowerCase()) || u.kd_upt?.includes(uptSearch)).map(u => (
                  <div
                    key={u.id}
                    style={{ padding: "10px 12px", borderBottom: "1px solid #E2E8F0", cursor: "pointer", background: form.unit === u.kd_upt ? "#F1F5F9" : "transparent" }}
                    onClick={() => { setForm({ ...form, unit: u.kd_upt || "" }); setShowUptDialog(false); }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 13, color: "#0F172A" }}>{u.nm_upt}</div>
                    <div style={{ fontSize: 11, color: "#64748B" }}>Kode: {u.kd_upt}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}