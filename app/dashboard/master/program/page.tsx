"use client";

import { useState, useEffect } from "react";
import { Plus, Edit3, Search, ChevronLeft, ChevronRight, Trash2, Check, LayoutGrid } from "lucide-react";

interface Program {
  id: number;
  kd_program: string;
  nm_program: string;
  kd_skpd: string | null;
  lpermen: number;
  kd_urusan: string | null;
}

export default function MasterProgramPage() {
  const [list, setList] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Program | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });

  const [form, setForm] = useState({
    kd_program: "",
    nm_program: "",
    kd_skpd: "",
    lpermen: 0,
    kd_urusan: "",
  });

  const loadData = () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      q: searchQuery,
    });

    fetch(`/api/master/program?${params.toString()}`)
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
    setForm({ kd_program: "", nm_program: "", kd_skpd: "", lpermen: 0, kd_urusan: "" });
    setShowForm(true);
  };

  const openEdit = (t: Program) => {
    setEditing(t);
    setForm({
      kd_program: t.kd_program || "",
      nm_program: t.nm_program || "",
      kd_skpd: t.kd_skpd || "",
      lpermen: t.lpermen || 0,
      kd_urusan: t.kd_urusan || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const url = "/api/master/program";
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

  const deleteProgram = async (t: Program) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus Program ${t.kd_program}?`)) return;
    try {
      const res = await fetch(`/api/master/program?id=${t.id}`, { method: "DELETE" });
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
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>📚 Master Program</h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>Kelola referensi data program kegiatan BLUD</p>
        </div>
        {!showForm ? (
          <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Tambah Program</button>
        ) : (
          <button className="btn btn-outline" onClick={() => setShowForm(false)}><ChevronLeft size={16} /> Kembali</button>
        )}
      </div>

      {!showForm && (
        <>
          {/* Filters */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
            <div style={{ position: "relative", width: 300 }}>
              <Search style={{ position: "absolute", left: 12, top: 10, color: "#94A3B8" }} size={16} />
              <input
                type="text"
                placeholder="Cari kode atau nama program..."
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
              <span className="card-title">Daftar Program</span>
            </div>
            {loading ? (
              <div className="empty-state" style={{ padding: 48 }}><div className="loading-spinner" /></div>
            ) : list.length === 0 ? (
              <div className="empty-state" style={{ padding: 48 }}>
                <div className="empty-state-icon">📚</div>
                <p style={{ fontWeight: 600 }}>Belum ada data program</p>
              </div>
            ) : (
              <div className="tbl-wrap" style={{ borderRadius: 0 }}>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th style={{ width: 40, textAlign: "center" }}>No</th>
                      <th style={{ width: 150 }}>Kode Program</th>
                      <th>Nama Program</th>
                      <th style={{ width: 120 }}>SKPD / Urusan</th>
                      <th style={{ width: 100 }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((t, i) => (
                      <tr key={t.id}>
                        <td style={{ textAlign: "center", fontSize: 12, color: "#64748B" }}>{(page - 1) * limit + i + 1}</td>
                        <td style={{ fontWeight: 700, fontSize: 14, color: "#0F172A", fontFamily: "monospace" }}>{t.kd_program}</td>
                        <td style={{ fontSize: 13, color: "#334155", fontWeight: 500 }}>{t.nm_program}</td>
                        <td style={{ fontSize: 12, color: "#64748B" }}>
                          <div>{t.kd_skpd || "-"}</div>
                          <div style={{ fontSize: 11, opacity: 0.8 }}>{t.kd_urusan || "-"}</div>
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 5 }}>
                            <button className="btn btn-outline btn-sm" onClick={() => openEdit(t)} title="Edit Program">
                              <Edit3 size={12} />
                            </button>
                            <button className="btn btn-sm" style={{ background: "#FEE2E2", color: "#DC2626", borderColor: "#FECACA" }} onClick={() => deleteProgram(t)} title="Hapus">
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
              {editing ? `✏️ Edit Program ${editing.kd_program}` : "➕ Tambah Program Baru"}
            </span>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="card-body" style={{ display: "grid", gap: 24, padding: "24px 32px" }}>
              
              {/* Group Detail Program */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 16, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  📄 Detail Program
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20 }}>
                  <div>
                    <label className="form-label">Kode Program *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      value={form.kd_program} 
                      onChange={(e) => setForm({ ...form, kd_program: e.target.value })} 
                      placeholder="Misal: 1.01.01"
                    />
                  </div>
                  <div>
                    <label className="form-label">Nama Program *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      value={form.nm_program} 
                      onChange={(e) => setForm({ ...form, nm_program: e.target.value })} 
                      placeholder="Misal: PROGRAM PELAYANAN KESEHATAN"
                    />
                  </div>
                </div>
              </div>

              {/* Group Atribut Tambahan */}
              <div style={{ paddingTop: 20, borderTop: "1px dashed #E2E8F0" }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 16, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  ⚙️ Atribut Tambahan
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
                  <div>
                    <label className="form-label">Kode SKPD</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={form.kd_skpd} 
                      onChange={(e) => setForm({ ...form, kd_skpd: e.target.value })} 
                      placeholder="Opsional"
                    />
                  </div>
                  <div>
                    <label className="form-label">Kode Urusan</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={form.kd_urusan} 
                      onChange={(e) => setForm({ ...form, kd_urusan: e.target.value })} 
                      placeholder="Opsional"
                    />
                  </div>
                  <div>
                    <label className="form-label">LPermen (Kesesuaian)</label>
                    <select 
                      className="form-select" 
                      value={form.lpermen} 
                      onChange={(e) => setForm({ ...form, lpermen: parseInt(e.target.value) })}
                    >
                      <option value="1">1 - Sesuai</option>
                      <option value="0">0 - Tidak Sesuai / Opsional</option>
                    </select>
                  </div>
                </div>
              </div>

            </div>
            <div className="card-footer" style={{ padding: "16px 24px", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Batal</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? <span className="loading-spinner" /> : <Check size={14} />}
                {submitting ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Simpan Program"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
