"use client";

import { useState, useEffect } from "react";
import { Plus, Edit3, Search, ChevronLeft, ChevronRight, Trash2, Check } from "lucide-react";

interface Komponen {
  id: number;
  kd_komponen: string;
  kd_peruntukan: string;
  nm_komponen: string;
}

interface Peruntukan {
  id: number;
  kd_peruntukan: string;
  nm_peruntukan: string;
}

export default function MasterKomponenPage() {
  const [list, setList] = useState<Komponen[]>([]);
  const [peruntukanList, setPeruntukanList] = useState<Peruntukan[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Komponen | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Table Filters
  const [filterPeruntukan, setFilterPeruntukan] = useState("");
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });

  const [form, setForm] = useState({
    kd_komponen: "",
    kd_peruntukan: "",
    nm_komponen: "",
  });

  const loadPeruntukan = async () => {
    try {
      const res = await fetch("/api/master/peruntukan-kegiatan?limit=1000");
      const data = await res.json();
      setPeruntukanList(data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadData = () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      q: searchQuery,
    });
    if (filterPeruntukan) params.append("peruntukan", filterPeruntukan);

    fetch(`/api/master/komponen-kegiatan?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        setList(d.data || []);
        if (d.pagination) setPagination(d.pagination);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPeruntukan();
  }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => { loadData(); }, [page, limit, searchQuery, filterPeruntukan]);

  const openCreate = () => {
    setEditing(null);
    setForm({ 
      kd_komponen: "", 
      kd_peruntukan: filterPeruntukan || "", 
      nm_komponen: "" 
    });
    setShowForm(true);
  };

  const openEdit = (t: Komponen) => {
    setEditing(t);
    setForm({
      kd_komponen: t.kd_komponen || "",
      kd_peruntukan: t.kd_peruntukan || "",
      nm_komponen: t.nm_komponen || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const url = "/api/master/komponen-kegiatan";
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

  const deleteKomponen = async (t: Komponen) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus Komponen ${t.nm_komponen}?`)) return;
    try {
      const res = await fetch(`/api/master/komponen-kegiatan?id=${t.id}`, { method: "DELETE" });
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
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>📂 Master Komponen Kegiatan</h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>Kelola referensi data komponen yang terhubung dengan Peruntukan Kegiatan</p>
        </div>
        {!showForm ? (
          <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Tambah Komponen</button>
        ) : (
          <button className="btn btn-outline" onClick={() => setShowForm(false)}><ChevronLeft size={16} /> Kembali</button>
        )}
      </div>

      {!showForm && (
        <>
          {/* Filters */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
            <div style={{ position: "relative", width: 280 }}>
              <Search style={{ position: "absolute", left: 12, top: 10, color: "#94A3B8" }} size={16} />
              <input
                type="text"
                placeholder="Cari kode atau nama komponen..."
                className="form-input"
                style={{ paddingLeft: 36, borderRadius: 20 }}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            
            <select 
              className="form-select" 
              style={{ width: 250, borderRadius: 20 }} 
              value={filterPeruntukan} 
              onChange={(e) => { setFilterPeruntukan(e.target.value); setPage(1); }}
            >
              <option value="">Semua Peruntukan</option>
              {peruntukanList.map((p) => (
                <option key={p.id} value={p.kd_peruntukan}>{p.kd_peruntukan} - {p.nm_peruntukan}</option>
              ))}
            </select>
          </div>

          {/* Tabel */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Daftar Komponen Kegiatan</span>
            </div>
            {loading ? (
              <div className="empty-state" style={{ padding: 48 }}><div className="loading-spinner" /></div>
            ) : list.length === 0 ? (
              <div className="empty-state" style={{ padding: 48 }}>
                <div className="empty-state-icon">📄</div>
                <p style={{ fontWeight: 600 }}>Belum ada data komponen kegiatan</p>
              </div>
            ) : (
              <div className="tbl-wrap" style={{ borderRadius: 0 }}>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th style={{ width: 40, textAlign: "center" }}>No</th>
                      <th style={{ width: 150 }}>Kode Komponen</th>
                      <th>Nama Komponen</th>
                      <th>Peruntukan Terkait</th>
                      <th style={{ width: 90 }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((t, i) => {
                      const parent = peruntukanList.find((p) => p.kd_peruntukan === t.kd_peruntukan);
                      
                      return (
                        <tr key={t.id}>
                          <td style={{ textAlign: "center", fontSize: 12, color: "#64748B" }}>{(page - 1) * limit + i + 1}</td>
                          <td style={{ fontWeight: 700, fontSize: 13, color: "#0F172A", fontFamily: "monospace" }}>{t.kd_komponen}</td>
                          <td style={{ fontSize: 13, color: "#334155", fontWeight: 500 }}>{t.nm_komponen}</td>
                          <td style={{ fontSize: 12, color: "#64748B" }}>
                            <div style={{ color: "#0F172A", fontWeight: 600 }}>{t.kd_peruntukan || "-"}</div>
                            <div style={{ fontSize: 11, opacity: 0.8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 250 }} title={parent?.nm_peruntukan}>
                              {parent ? parent.nm_peruntukan : "Tidak ditemukan"}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: 5 }}>
                              <button className="btn btn-outline btn-sm" onClick={() => openEdit(t)} title="Edit">
                                <Edit3 size={12} />
                              </button>
                              <button className="btn btn-sm" style={{ background: "#FEE2E2", color: "#DC2626", borderColor: "#FECACA" }} onClick={() => deleteKomponen(t)} title="Hapus">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
              {editing ? `✏️ Edit Komponen ${editing.kd_komponen}` : "➕ Tambah Komponen Baru"}
            </span>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="card-body" style={{ display: "grid", gap: 24, padding: "24px 32px" }}>
              
              {/* Group Relasi Induk */}
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 16, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  🔗 Relasi Peruntukan
                </div>
                <div>
                  <label className="form-label">Peruntukan Terkait *</label>
                  <select 
                    className="form-select" 
                    required 
                    value={form.kd_peruntukan} 
                    onChange={(e) => setForm({ ...form, kd_peruntukan: e.target.value })}
                  >
                    <option value="">-- Pilih Peruntukan --</option>
                    {peruntukanList.map((p) => (
                      <option key={p.id} value={p.kd_peruntukan}>{p.kd_peruntukan} - {p.nm_peruntukan}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Group Data Utama */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 16, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  📄 Detail Komponen
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20 }}>
                  <div>
                    <label className="form-label">Kode Komponen *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      value={form.kd_komponen} 
                      onChange={(e) => setForm({ ...form, kd_komponen: e.target.value })} 
                      placeholder="Misal: K-01"
                    />
                  </div>
                  <div>
                    <label className="form-label">Nama Komponen *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      value={form.nm_komponen} 
                      onChange={(e) => setForm({ ...form, nm_komponen: e.target.value })} 
                      placeholder="Misal: Pengadaan Sarana dan Prasarana"
                    />
                  </div>
                </div>
              </div>

            </div>
            <div className="card-footer" style={{ padding: "16px 24px", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Batal</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? <span className="loading-spinner" /> : <Check size={14} />}
                {submitting ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Simpan Komponen"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
