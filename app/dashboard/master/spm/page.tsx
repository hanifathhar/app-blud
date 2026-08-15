"use client";

import { useState, useEffect } from "react";
import { Plus, Edit3, Search, ChevronLeft, ChevronRight, Trash2, X, Check } from "lucide-react";

interface Spm {
  id: number;
  kd_spm: number;
  nm_spm: string;
}

export default function MasterSpmPage() {
  const [list, setList] = useState<Spm[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog state
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<Spm | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });

  const [form, setForm] = useState({
    kd_spm: "",
    nm_spm: "",
  });

  const loadData = () => {
    setLoading(true);
    fetch(`/api/master/spm?page=${page}&limit=${limit}&q=${encodeURIComponent(searchQuery)}`)
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
    setForm({ kd_spm: "", nm_spm: "" });
    setShowDialog(true);
  };

  const openEdit = (t: Spm) => {
    setEditing(t);
    setForm({
      kd_spm: t.kd_spm?.toString() || "",
      nm_spm: t.nm_spm || "",
    });
    setShowDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const url = "/api/master/spm";
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
        setShowDialog(false);
        loadData();
      }
    } catch (err) {
      alert("Terjadi kesalahan sistem");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteSpm = async (t: Spm) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus SPM ${t.nm_spm}?`)) return;
    try {
      const res = await fetch(`/api/master/spm?id=${t.id}`, { method: "DELETE" });
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
    <div className="animate-fadein relative">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>📂 Master SPM</h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>Kelola data referensi Standar Pelayanan Minimal (SPM)</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} /> Tambah SPM
        </button>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <div style={{ position: "relative", width: 300 }}>
          <Search style={{ position: "absolute", left: 12, top: 10, color: "#94A3B8" }} size={16} />
          <input
            type="text"
            placeholder="Cari kode atau nama SPM..."
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
          <span className="card-title">Daftar SPM</span>
        </div>
        {loading ? (
          <div className="empty-state" style={{ padding: 48 }}><div className="loading-spinner" /></div>
        ) : list.length === 0 ? (
          <div className="empty-state" style={{ padding: 48 }}>
            <div className="empty-state-icon">📄</div>
            <p style={{ fontWeight: 600 }}>Belum ada data SPM</p>
          </div>
        ) : (
          <div className="tbl-wrap" style={{ borderRadius: 0 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 40, textAlign: "center" }}>No</th>
                  <th style={{ width: 150 }}>Kode SPM</th>
                  <th>Nama SPM</th>
                  <th style={{ width: 90 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {list.map((t, i) => (
                  <tr key={t.id}>
                    <td style={{ textAlign: "center", fontSize: 12, color: "#64748B" }}>{(page - 1) * limit + i + 1}</td>
                    <td style={{ fontWeight: 700, fontSize: 13, color: "#0F172A", fontFamily: "monospace" }}>{t.kd_spm}</td>
                    <td style={{ fontSize: 13, color: "#334155", fontWeight: 500 }}>{t.nm_spm}</td>
                    <td>
                      <div style={{ display: "flex", gap: 5 }}>
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(t)} title="Edit">
                          <Edit3 size={12} />
                        </button>
                        <button className="btn btn-sm" style={{ background: "#FEE2E2", color: "#DC2626", borderColor: "#FECACA" }} onClick={() => deleteSpm(t)} title="Hapus">
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

      {/* Dialog Form */}
      {showDialog && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: "rgba(0,0,0,0.4)", zIndex: 9999, 
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "fadeIn 0.2s ease-out"
        }}>
          <div style={{
            background: "#fff", width: 500, borderRadius: 16, 
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            animation: "slideUp 0.3s ease-out"
          }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", margin: 0 }}>
                {editing ? "✏️ Edit SPM" : "➕ Tambah SPM Baru"}
              </h2>
              <button type="button" onClick={() => setShowDialog(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#94A3B8" }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div style={{ padding: 24, display: "grid", gap: 20 }}>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, color: "#334155" }}>Kode SPM *</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    required 
                    value={form.kd_spm} 
                    onChange={(e) => setForm({ ...form, kd_spm: e.target.value })} 
                    placeholder="Misal: 1"
                    style={{ background: "#F8FAFC" }}
                  />
                </div>
                <div>
                  <label className="form-label" style={{ fontWeight: 600, color: "#334155" }}>Nama SPM *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    required 
                    value={form.nm_spm} 
                    onChange={(e) => setForm({ ...form, nm_spm: e.target.value })} 
                    placeholder="Misal: Pelayanan Kesehatan Ibu Hamil"
                    style={{ background: "#F8FAFC" }}
                  />
                </div>
              </div>
              
              <div style={{ padding: "16px 24px", borderTop: "1px solid #F1F5F9", background: "#F8FAFC", borderBottomLeftRadius: 16, borderBottomRightRadius: 16, display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowDialog(false)} style={{ background: "#fff" }}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <span className="loading-spinner" /> : <Check size={16} />}
                  {submitting ? "Menyimpan..." : "Simpan SPM"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}
