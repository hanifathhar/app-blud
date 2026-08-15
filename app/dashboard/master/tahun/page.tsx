"use client";

import { useState, useEffect } from "react";
import { Plus, Edit3, X, Search, ChevronLeft, ChevronRight, Trash2, Calendar, CheckCircle, XCircle } from "lucide-react";

interface TahunAnggaran {
  id: number;
  tahun: number;
  status: string;
  keterangan: string | null;
  created_at: string;
}

export default function TahunAnggaranPage() {
  const [list, setList] = useState<TahunAnggaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<TahunAnggaran | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });

  const [form, setForm] = useState({
    tahun: new Date().getFullYear(),
    status: "aktif",
    keterangan: "",
  });

  const loadData = () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      q: searchQuery,
    });

    fetch(`/api/master/tahun?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        setList(d.data || []);
        if (d.pagination) setPagination(d.pagination);
      })
      .finally(() => setLoading(false));
  };

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => { loadData(); }, [page, limit, searchQuery]);

  const openCreate = () => {
    setEditing(null);
    setForm({ tahun: new Date().getFullYear(), status: "aktif", keterangan: "" });
    setShowForm(true);
  };

  const openEdit = (t: TahunAnggaran) => {
    setEditing(t);
    setForm({
      tahun: t.tahun,
      status: t.status,
      keterangan: t.keterangan || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const url = "/api/master/tahun";
      const method = editing ? "PUT" : "POST";
      const body = editing ? { ...form, id: editing.id } : form;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Terjadi kesalahan");
      } else {
        setShowForm(false);
        loadData();
      }
    } catch (err) {
      alert("Terjadi kesalahan sistem");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (t: TahunAnggaran) => {
    await fetch("/api/master/tahun", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: t.id, status: t.status === "aktif" ? "tutup" : "aktif" }),
    });
    loadData();
  };

  const deleteTahun = async (t: TahunAnggaran) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus Tahun Anggaran ${t.tahun}?`)) return;
    try {
      const res = await fetch(`/api/master/tahun?id=${t.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Gagal menghapus data");
      }
    } catch (e) {
      alert("Terjadi kesalahan sistem");
    }
    loadData();
  };

  return (
    <div className="animate-fadein">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>📅 Tahun Anggaran</h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>Kelola referensi tahun anggaran untuk sistem keuangan</p>
        </div>
        {!showForm ? (
          <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Tambah Tahun</button>
        ) : (
          <button className="btn btn-outline" onClick={() => setShowForm(false)}><ChevronLeft size={16} /> Kembali</button>
        )}
      </div>

      {!showForm && (
        <>
          {/* Filters */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
            <div style={{ position: "relative", width: 250 }}>
              <Search style={{ position: "absolute", left: 12, top: 10, color: "#94A3B8" }} size={16} />
              <input
                type="text"
                placeholder="Cari tahun..."
                className="form-input"
                style={{ paddingLeft: 36, borderRadius: 20 }}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
          </div>

          {/* Tabel */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Daftar Tahun Anggaran</span>
            </div>
            {loading ? (
              <div className="empty-state" style={{ padding: 48 }}><div className="loading-spinner" /></div>
            ) : list.length === 0 ? (
              <div className="empty-state" style={{ padding: 48 }}>
                <div className="empty-state-icon">📅</div>
                <p style={{ fontWeight: 600 }}>Belum ada data tahun anggaran</p>
              </div>
            ) : (
              <div className="tbl-wrap" style={{ borderRadius: 0 }}>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th style={{ width: 40, textAlign: "center" }}>No</th>
                      <th>Tahun</th>
                      <th>Keterangan</th>
                      <th>Status</th>
                      <th>Tgl Dibuat</th>
                      <th style={{ width: 120 }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((t, i) => (
                      <tr key={t.id}>
                        <td style={{ textAlign: "center", fontSize: 12, color: "#64748B" }}>{(page - 1) * limit + i + 1}</td>
                        <td style={{ fontWeight: 700, fontSize: 15, color: "#0F172A" }}>{t.tahun}</td>
                        <td style={{ fontSize: 13, color: "#64748B" }}>{t.keterangan || "-"}</td>
                        <td>
                          <span className={`badge ${t.status === "aktif" ? "badge-disetujui" : "badge-ditolak"}`}>
                            {t.status === "aktif" ? "Aktif" : "Tutup"}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: "#64748B" }}>
                          {new Date(t.created_at).toLocaleDateString("id-ID")}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 5 }}>
                            <button className="btn btn-outline btn-sm" onClick={() => openEdit(t)} title="Edit Tahun">
                              <Edit3 size={12} />
                            </button>
                            <button
                              className={`btn btn-sm ${t.status === "aktif" ? "btn-warning" : "btn-success"}`}
                              onClick={() => toggleStatus(t)}
                              title={t.status === "aktif" ? "Tutup Tahun" : "Aktifkan Tahun"}
                              style={{
                                background: t.status === "aktif" ? "#FEF3C7" : "#DCFCE7",
                                color: t.status === "aktif" ? "#D97706" : "#16A34A",
                                borderColor: t.status === "aktif" ? "#FDE68A" : "#BBF7D0",
                              }}
                            >
                              {t.status === "aktif" ? <XCircle size={12} /> : <CheckCircle size={12} />}
                            </button>
                            <button className="btn btn-sm" style={{ background: "#FEE2E2", color: "#DC2626", borderColor: "#FECACA" }} onClick={() => deleteTahun(t)} title="Hapus">
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
            {!loading && list.length > 0 && (
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

      {/* Form Card */}
      {showForm && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">
              {editing ? `✏️ Edit — Tahun ${editing.tahun}` : "➕ Tambah Tahun Anggaran Baru"}
            </span>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="card-body" style={{ display: "grid", gap: 16, padding: 24 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label className="form-label">Tahun Anggaran *</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    required 
                    value={form.tahun} 
                    onChange={(e) => setForm({ ...form, tahun: parseInt(e.target.value) || new Date().getFullYear() })} 
                    disabled={!!editing}
                  />
                </div>
                <div>
                  <label className="form-label">Status *</label>
                  <select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="aktif">Aktif</option>
                    <option value="tutup">Tutup</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">Keterangan</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: 80, resize: "vertical" }}
                  value={form.keterangan}
                  onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                  placeholder="Opsional"
                />
              </div>
            </div>
            <div className="card-footer" style={{ padding: "16px 24px", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Batal</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? <span className="loading-spinner" /> : <Calendar size={14} />}
                {submitting ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Simpan Tahun"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
