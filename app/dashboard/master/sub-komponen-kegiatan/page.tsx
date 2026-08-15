"use client";

import { useState, useEffect } from "react";
import { Plus, Edit3, Search, ChevronLeft, ChevronRight, Trash2, Check } from "lucide-react";

interface RincianKegiatan {
  id: number;
  kd_komponen: string;
  kd_rincian: string;
  nm_rincian: string;
}

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

export default function MasterSubKomponenPage() {
  const [list, setList] = useState<RincianKegiatan[]>([]);
  const [peruntukanList, setPeruntukanList] = useState<Peruntukan[]>([]);
  const [komponenList, setKomponenList] = useState<Komponen[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<RincianKegiatan | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Table Filters
  const [filterPeruntukan, setFilterPeruntukan] = useState("");
  const [filterKomponen, setFilterKomponen] = useState("");
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });

  const [form, setForm] = useState({
    kd_peruntukan: "",
    kd_komponen: "",
    kd_rincian: "",
    nm_rincian: "",
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

  const loadAllKomponen = async () => {
    try {
      const res = await fetch("/api/master/komponen-kegiatan?limit=5000");
      const data = await res.json();
      setKomponenList(data.data || []);
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
    if (filterKomponen) params.append("komponen", filterKomponen);

    fetch(`/api/master/rincian-kegiatan?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        setList(d.data || []);
        if (d.pagination) setPagination(d.pagination);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPeruntukan();
    loadAllKomponen();
  }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => { loadData(); }, [page, limit, searchQuery, filterKomponen]);

  // When filterPeruntukan changes, if filterKomponen doesn't belong to it, reset filterKomponen
  useEffect(() => {
    if (filterPeruntukan && filterKomponen) {
      const comp = komponenList.find(k => k.kd_komponen === filterKomponen);
      if (comp && comp.kd_peruntukan !== filterPeruntukan) {
        setFilterKomponen("");
        setPage(1);
      }
    }
  }, [filterPeruntukan, komponenList]);

  // Derive form options
  const formKomponenOptions = form.kd_peruntukan 
    ? komponenList.filter(k => k.kd_peruntukan === form.kd_peruntukan)
    : [];

  const filterKomponenOptions = filterPeruntukan
    ? komponenList.filter(k => k.kd_peruntukan === filterPeruntukan)
    : komponenList;

  const openCreate = () => {
    setEditing(null);
    setForm({ 
      kd_peruntukan: filterPeruntukan || "",
      kd_komponen: filterKomponen || "",
      kd_rincian: "", 
      nm_rincian: "" 
    });
    setShowForm(true);
  };

  const openEdit = (t: RincianKegiatan) => {
    setEditing(t);
    const parentKomponen = komponenList.find(k => k.kd_komponen === t.kd_komponen);
    
    setForm({
      kd_peruntukan: parentKomponen ? parentKomponen.kd_peruntukan : "",
      kd_komponen: t.kd_komponen || "",
      kd_rincian: t.kd_rincian || "",
      nm_rincian: t.nm_rincian || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const url = "/api/master/rincian-kegiatan";
      const method = editing ? "PUT" : "POST";
      
      const payload = {
        kd_komponen: form.kd_komponen,
        kd_rincian: form.kd_rincian,
        nm_rincian: form.nm_rincian
      };
      
      const body = editing ? { ...payload, id: editing.id } : payload;

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

  const deleteRincian = async (t: RincianKegiatan) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus Sub Komponen ${t.nm_rincian}?`)) return;
    try {
      const res = await fetch(`/api/master/rincian-kegiatan?id=${t.id}`, { method: "DELETE" });
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
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>📋 Master Sub Komponen</h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>Kelola referensi rincian kegiatan (Sub Komponen)</p>
        </div>
        {!showForm ? (
          <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Tambah Sub Komponen</button>
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
                placeholder="Cari kode atau nama..."
                className="form-input"
                style={{ paddingLeft: 36, borderRadius: 20 }}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            
            <select 
              className="form-select" 
              style={{ width: 220, borderRadius: 20 }} 
              value={filterPeruntukan} 
              onChange={(e) => { setFilterPeruntukan(e.target.value); }}
            >
              <option value="">Semua Peruntukan</option>
              {peruntukanList.map((p) => (
                <option key={p.id} value={p.kd_peruntukan}>{p.kd_peruntukan} - {p.nm_peruntukan}</option>
              ))}
            </select>

            <select 
              className="form-select" 
              style={{ width: 250, borderRadius: 20 }} 
              value={filterKomponen} 
              onChange={(e) => { setFilterKomponen(e.target.value); setPage(1); }}
            >
              <option value="">Semua Komponen</option>
              {filterKomponenOptions.map((k) => (
                <option key={k.id} value={k.kd_komponen}>{k.kd_komponen} - {k.nm_komponen}</option>
              ))}
            </select>
          </div>

          {/* Tabel */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Daftar Sub Komponen (Rincian Kegiatan)</span>
            </div>
            {loading ? (
              <div className="empty-state" style={{ padding: 48 }}><div className="loading-spinner" /></div>
            ) : list.length === 0 ? (
              <div className="empty-state" style={{ padding: 48 }}>
                <div className="empty-state-icon">📄</div>
                <p style={{ fontWeight: 600 }}>Belum ada data sub komponen</p>
              </div>
            ) : (
              <div className="tbl-wrap" style={{ borderRadius: 0 }}>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th style={{ width: 40, textAlign: "center" }}>No</th>
                      <th style={{ width: 150 }}>Kode Rincian</th>
                      <th>Nama Sub Komponen</th>
                      <th>Komponen Terkait</th>
                      <th style={{ width: 90 }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((t, i) => {
                      const parent = komponenList.find((k) => k.kd_komponen === t.kd_komponen);
                      const grandParent = parent ? peruntukanList.find(p => p.kd_peruntukan === parent.kd_peruntukan) : null;
                      
                      return (
                        <tr key={t.id}>
                          <td style={{ textAlign: "center", fontSize: 12, color: "#64748B" }}>{(page - 1) * limit + i + 1}</td>
                          <td style={{ fontWeight: 700, fontSize: 13, color: "#0F172A", fontFamily: "monospace" }}>{t.kd_rincian}</td>
                          <td style={{ fontSize: 13, color: "#334155", fontWeight: 500 }}>{t.nm_rincian}</td>
                          <td style={{ fontSize: 12, color: "#64748B" }}>
                            <div style={{ color: "#0F172A", fontWeight: 600 }}>{t.kd_komponen || "-"}</div>
                            <div style={{ fontSize: 11, opacity: 0.8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 250 }} title={parent?.nm_komponen}>
                              {parent ? parent.nm_komponen : "Tidak ditemukan"}
                            </div>
                            {grandParent && (
                              <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 2 }}>
                                Peruntukan: {grandParent.nm_peruntukan}
                              </div>
                            )}
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: 5 }}>
                              <button className="btn btn-outline btn-sm" onClick={() => openEdit(t)} title="Edit">
                                <Edit3 size={12} />
                              </button>
                              <button className="btn btn-sm" style={{ background: "#FEE2E2", color: "#DC2626", borderColor: "#FECACA" }} onClick={() => deleteRincian(t)} title="Hapus">
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
              {editing ? `✏️ Edit Sub Komponen ${editing.kd_rincian}` : "➕ Tambah Sub Komponen Baru"}
            </span>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="card-body" style={{ display: "grid", gap: 24, padding: "24px 32px" }}>
              
              {/* Group Relasi Induk */}
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  🔗 Relasi Hierarki
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  <div>
                    <label className="form-label">1. Pilih Peruntukan</label>
                    <select 
                      className="form-select" 
                      value={form.kd_peruntukan} 
                      onChange={(e) => setForm({ ...form, kd_peruntukan: e.target.value, kd_komponen: "" })}
                    >
                      <option value="">-- Pilih Peruntukan --</option>
                      {peruntukanList.map((p) => (
                        <option key={p.id} value={p.kd_peruntukan}>{p.kd_peruntukan} - {p.nm_peruntukan}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">2. Komponen Terkait *</label>
                    <select 
                      className="form-select" 
                      required 
                      value={form.kd_komponen} 
                      onChange={(e) => setForm({ ...form, kd_komponen: e.target.value })}
                      disabled={!form.kd_peruntukan}
                    >
                      <option value="">-- Pilih Komponen --</option>
                      {formKomponenOptions.map((k) => (
                        <option key={k.id} value={k.kd_komponen}>{k.kd_komponen} - {k.nm_komponen}</option>
                      ))}
                    </select>
                    {!form.kd_peruntukan && (
                      <div style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>
                        * Silakan pilih peruntukan terlebih dahulu
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Group Data Utama */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 16, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  📄 Detail Sub Komponen (Rincian Kegiatan)
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20 }}>
                  <div>
                    <label className="form-label">Kode Sub Komponen *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      value={form.kd_rincian} 
                      onChange={(e) => setForm({ ...form, kd_rincian: e.target.value })} 
                      placeholder="Misal: SK-01"
                    />
                  </div>
                  <div>
                    <label className="form-label">Nama Sub Komponen *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      value={form.nm_rincian} 
                      onChange={(e) => setForm({ ...form, nm_rincian: e.target.value })} 
                      placeholder="Misal: Belanja ATK"
                    />
                  </div>
                </div>
              </div>

            </div>
            <div className="card-footer" style={{ padding: "16px 24px", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Batal</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? <span className="loading-spinner" /> : <Check size={14} />}
                {submitting ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Simpan Sub Komponen"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
