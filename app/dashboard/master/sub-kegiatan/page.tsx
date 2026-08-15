"use client";

import { useState, useEffect } from "react";
import { Plus, Edit3, Search, ChevronLeft, ChevronRight, Trash2, Check } from "lucide-react";

interface SubKegiatan {
  id: number;
  kd_sub_kegiatan: string;
  kd_kegiatan: string;
  kd_program: string;
  nm_sub_kegiatan: string;
}

interface Program {
  id: number;
  kd_program: string;
  nm_program: string;
}

interface Kegiatan {
  id: number;
  kd_kegiatan: string;
  kd_program: string;
  nm_kegiatan: string;
}

export default function MasterSubKegiatanPage() {
  const [list, setList] = useState<SubKegiatan[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [kegiatans, setKegiatans] = useState<Kegiatan[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SubKegiatan | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Table Filters
  const [filterProgram, setFilterProgram] = useState("");
  const [filterKegiatan, setFilterKegiatan] = useState("");
  
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 });

  const [form, setForm] = useState({
    kd_sub_kegiatan: "",
    kd_kegiatan: "",
    kd_program: "",
    nm_sub_kegiatan: "",
  });

  const loadProgramsAndKegiatan = async () => {
    try {
      const [resProg, resGiat] = await Promise.all([
        fetch("/api/master/program?limit=1000"),
        fetch("/api/master/kegiatan?limit=2000")
      ]);
      const dataProg = await resProg.json();
      const dataGiat = await resGiat.json();
      setPrograms(dataProg.data || []);
      setKegiatans(dataGiat.data || []);
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
    if (filterProgram) params.append("program", filterProgram);
    if (filterKegiatan) params.append("kegiatan", filterKegiatan);

    fetch(`/api/master/sub-kegiatan?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        setList(d.data || []);
        if (d.pagination) setPagination(d.pagination);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProgramsAndKegiatan();
  }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => { loadData(); }, [page, limit, searchQuery, filterProgram, filterKegiatan]);

  // Reset filterKegiatan if filterProgram changes and it doesn't match
  useEffect(() => {
    if (filterProgram && filterKegiatan) {
      const giat = kegiatans.find(k => k.kd_kegiatan === filterKegiatan);
      if (giat && giat.kd_program !== filterProgram) {
        setFilterKegiatan("");
      }
    }
  }, [filterProgram, kegiatans, filterKegiatan]);

  // Form cascading effect
  useEffect(() => {
    if (form.kd_program && form.kd_kegiatan) {
      const giat = kegiatans.find(k => k.kd_kegiatan === form.kd_kegiatan);
      if (giat && giat.kd_program !== form.kd_program) {
        setForm(f => ({ ...f, kd_kegiatan: "" }));
      }
    }
  }, [form.kd_program, kegiatans]);

  const openCreate = () => {
    setEditing(null);
    setForm({ 
      kd_sub_kegiatan: "", 
      kd_kegiatan: filterKegiatan || "", 
      kd_program: filterProgram || "", 
      nm_sub_kegiatan: "" 
    });
    setShowForm(true);
  };

  const openEdit = (t: SubKegiatan) => {
    setEditing(t);
    setForm({
      kd_sub_kegiatan: (t.kd_sub_kegiatan || "").trim(),
      kd_kegiatan: (t.kd_kegiatan || "").trim(),
      kd_program: (t.kd_program || "").trim(),
      nm_sub_kegiatan: t.nm_sub_kegiatan || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const url = "/api/master/sub-kegiatan";
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

  const deleteSubKegiatan = async (t: SubKegiatan) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus Sub Kegiatan ${t.kd_sub_kegiatan}?`)) return;
    try {
      const res = await fetch(`/api/master/sub-kegiatan?id=${t.id}`, { method: "DELETE" });
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
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>📂 Master Sub Kegiatan</h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>Kelola referensi data sub kegiatan yang terhubung dengan Program & Kegiatan</p>
        </div>
        {!showForm ? (
          <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> Tambah Sub Kegiatan</button>
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
              value={filterProgram} 
              onChange={(e) => { setFilterProgram(e.target.value); setPage(1); }}
            >
              <option value="">Semua Program</option>
              {programs.map((p) => (
                <option key={p.id} value={p.kd_program}>{p.kd_program} - {p.nm_program}</option>
              ))}
            </select>

            <select 
              className="form-select" 
              style={{ width: 220, borderRadius: 20 }} 
              value={filterKegiatan} 
              onChange={(e) => { setFilterKegiatan(e.target.value); setPage(1); }}
            >
              <option value="">Semua Kegiatan</option>
              {kegiatans
                .filter(k => (filterProgram ? k.kd_program === filterProgram : true))
                .map((k) => (
                  <option key={k.id} value={k.kd_kegiatan}>{k.kd_kegiatan} - {k.nm_kegiatan}</option>
                ))}
            </select>
          </div>

          {/* Tabel */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Daftar Sub Kegiatan</span>
            </div>
            {loading ? (
              <div className="empty-state" style={{ padding: 48 }}><div className="loading-spinner" /></div>
            ) : list.length === 0 ? (
              <div className="empty-state" style={{ padding: 48 }}>
                <div className="empty-state-icon">📄</div>
                <p style={{ fontWeight: 600 }}>Belum ada data sub kegiatan</p>
              </div>
            ) : (
              <div className="tbl-wrap" style={{ borderRadius: 0 }}>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th style={{ width: 40, textAlign: "center" }}>No</th>
                      <th style={{ width: 160 }}>Kode Sub Kegiatan</th>
                      <th>Nama Sub Kegiatan</th>
                      <th>Program & Kegiatan</th>
                      <th style={{ width: 90 }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((t, i) => {
                      const prog = programs.find((p) => p.kd_program === t.kd_program);
                      const giat = kegiatans.find((k) => k.kd_kegiatan === t.kd_kegiatan);
                      
                      return (
                        <tr key={t.id}>
                          <td style={{ textAlign: "center", fontSize: 12, color: "#64748B" }}>{(page - 1) * limit + i + 1}</td>
                          <td style={{ fontWeight: 700, fontSize: 13, color: "#0F172A", fontFamily: "monospace" }}>{t.kd_sub_kegiatan}</td>
                          <td style={{ fontSize: 13, color: "#334155", fontWeight: 500 }}>{t.nm_sub_kegiatan}</td>
                          <td style={{ fontSize: 12, color: "#64748B" }}>
                            <div style={{ color: "#0F172A", fontWeight: 600 }}>{t.kd_kegiatan || "-"}</div>
                            <div style={{ fontSize: 11, opacity: 0.8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 220 }} title={giat?.nm_kegiatan}>
                              G: {giat ? giat.nm_kegiatan : "Tidak ditemukan"}
                            </div>
                            <div style={{ fontSize: 11, opacity: 0.7, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 220 }} title={prog?.nm_program}>
                              P: {prog ? prog.nm_program : t.kd_program}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: 5 }}>
                              <button className="btn btn-outline btn-sm" onClick={() => openEdit(t)} title="Edit">
                                <Edit3 size={12} />
                              </button>
                              <button className="btn btn-sm" style={{ background: "#FEE2E2", color: "#DC2626", borderColor: "#FECACA" }} onClick={() => deleteSubKegiatan(t)} title="Hapus">
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
              {editing ? `✏️ Edit Sub Kegiatan ${editing.kd_sub_kegiatan}` : "➕ Tambah Sub Kegiatan Baru"}
            </span>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="card-body" style={{ display: "grid", gap: 24, padding: "24px 32px" }}>
              
              {/* Group Relasi Induk */}
              <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 16, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  🔗 Relasi Induk
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  <div>
                    <label className="form-label">Program Terkait *</label>
                    <select 
                      className="form-select" 
                      required 
                      value={form.kd_program} 
                      onChange={(e) => setForm({ ...form, kd_program: e.target.value })}
                    >
                      <option value="">-- Pilih Program --</option>
                      {programs.map((p) => (
                        <option key={p.id} value={p.kd_program}>{p.kd_program} - {p.nm_program}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Kegiatan Terkait *</label>
                    <select 
                      className="form-select" 
                      required 
                      value={form.kd_kegiatan} 
                      onChange={(e) => setForm({ ...form, kd_kegiatan: e.target.value })}
                      disabled={!form.kd_program}
                    >
                      <option value="">-- Pilih Kegiatan --</option>
                      {kegiatans
                        .filter(k => k.kd_program === form.kd_program)
                        .map((k) => (
                          <option key={k.id} value={k.kd_kegiatan}>{k.kd_kegiatan} - {k.nm_kegiatan}</option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Group Data Utama */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 16, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  📄 Detail Sub Kegiatan
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20 }}>
                  <div>
                    <label className="form-label">Kode Sub Kegiatan *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      value={form.kd_sub_kegiatan} 
                      onChange={(e) => setForm({ ...form, kd_sub_kegiatan: e.target.value })} 
                      placeholder="Misal: 1.01.01.2.01.01"
                    />
                  </div>
                  <div>
                    <label className="form-label">Nama Sub Kegiatan *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required 
                      value={form.nm_sub_kegiatan} 
                      onChange={(e) => setForm({ ...form, nm_sub_kegiatan: e.target.value })} 
                      placeholder="Misal: Penyediaan Jasa Surat Menyurat"
                    />
                  </div>
                </div>
              </div>

            </div>
            <div className="card-footer" style={{ padding: "16px 24px", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Batal</button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? <span className="loading-spinner" /> : <Check size={14} />}
                {submitting ? "Menyimpan..." : editing ? "Simpan Perubahan" : "Simpan Sub Kegiatan"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
