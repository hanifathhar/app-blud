"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, Building2, ChevronLeft, ChevronRight } from "lucide-react";

interface UPT {
  id: number;
  kd_upt: string | null;
  nm_upt: string | null;
  alamat: string | null;
  kecamatan: string | null;
  kabupaten: string | null;
  email: string | null;
  no_tlp: string | null;
  type: string | null;
  status: number;
}

export default function MasterUptPage() {
  const [list, setList] = useState<UPT[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Pagination states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [form, setForm] = useState({
    kd_upt: "",
    nm_upt: "",
    type: "Puskesmas",
    alamat: "",
    kecamatan: "",
    kabupaten: "",
    email: "",
    no_tlp: "",
    status: 1
  });

  const loadData = () => {
    setLoading(true);
    fetch(`/api/upt?q=${encodeURIComponent(search)}&page=${page}&limit=${limit}`)
      .then((r) => r.json())
      .then((d) => {
        setList(d.data || []);
        if (d.pagination) {
          setTotal(d.pagination.total);
          setTotalPages(d.pagination.totalPages);
        }
      })
      .finally(() => setLoading(false));
  };

  // Reset page to 1 on search
  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => { loadData(); }, [search, page, limit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const url = editingId ? `/api/upt/${editingId}` : "/api/upt";
    const method = editingId ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    if (res.ok) {
      setShowForm(false);
      setEditingId(null);
      setForm({ kd_upt: "", nm_upt: "", type: "Puskesmas", alamat: "", kecamatan: "", kabupaten: "", email: "", no_tlp: "", status: 1 });
      loadData();
    }
    setSubmitting(false);
  };

  const handleEdit = (u: UPT) => {
    setForm({
      kd_upt: u.kd_upt || "",
      nm_upt: u.nm_upt || "",
      type: u.type || "Puskesmas",
      alamat: u.alamat || "",
      kecamatan: u.kecamatan || "",
      kabupaten: u.kabupaten || "",
      email: u.email || "",
      no_tlp: u.no_tlp || "",
      status: u.status
    });
    setEditingId(u.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus UPT ini?")) return;
    await fetch(`/api/upt/${id}`, { method: "DELETE" });
    loadData();
  };

  return (
    <div className="animate-fadein">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", display: "flex", alignItems: "center", gap: 8 }}>
            <Building2 size={24} color="#2563EB" /> Manajemen UPT
          </h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>Kelola data Unit Pelaksana Teknis (Puskesmas & RSUD)</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <div style={{ position: "relative" }}>
            <Search size={16} color="#94A3B8" style={{ position: "absolute", left: 14, top: 13 }} />
            <input
              type="text"
              placeholder="Cari nama UPT..."
              className="form-input"
              style={{ width: 280, paddingLeft: 38, borderRadius: 999, border: "1px solid #E2E8F0", boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)" }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingId(null);
              setForm({ kd_upt: "", nm_upt: "", type: "Puskesmas", alamat: "", kecamatan: "", kabupaten: "", email: "", no_tlp: "", status: 1 });
              setShowForm(true);
            }}
          >
            <Plus size={16} /> Tambah UPT
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden", border: "1px solid #E2E8F0", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)" }}>
        {loading && list.length === 0 ? (
          <div className="empty-state" style={{ padding: 60 }}><div className="loading-spinner" /><p style={{ marginTop: 12 }}>Memuat data UPT...</p></div>
        ) : list.length === 0 ? (
          <div className="empty-state" style={{ padding: 60 }}>
            <div style={{ background: "#F1F5F9", width: 64, height: 64, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Building2 size={32} color="#94A3B8" />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1E293B", marginBottom: 4 }}>Tidak ada data UPT</h3>
            <p style={{ color: "#64748B", fontSize: 14 }}>Coba ubah kata kunci pencarian atau tambah data baru.</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table className="table" style={{ width: "100%", borderCollapse: "collapse", whiteSpace: "nowrap" }}>
                <thead style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                  <tr>
                    <th style={{ padding: "16px 20px", fontSize: 13, fontWeight: 600, color: "#475569", textAlign: "left", width: 60 }}>No</th>
                    <th style={{ padding: "16px 20px", fontSize: 13, fontWeight: 600, color: "#475569", textAlign: "left" }}>Kode UPT</th>
                    <th style={{ padding: "16px 20px", fontSize: 13, fontWeight: 600, color: "#475569", textAlign: "left" }}>Nama UPT</th>
                    <th style={{ padding: "16px 20px", fontSize: 13, fontWeight: 600, color: "#475569", textAlign: "left" }}>Tipe</th>
                    <th style={{ padding: "16px 20px", fontSize: 13, fontWeight: 600, color: "#475569", textAlign: "left" }}>Lokasi</th>
                    <th style={{ padding: "16px 20px", fontSize: 13, fontWeight: 600, color: "#475569", textAlign: "left" }}>Status</th>
                    <th style={{ padding: "16px 20px", fontSize: 13, fontWeight: 600, color: "#475569", textAlign: "right", width: 100 }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((u, i) => (
                    <tr key={u.id} style={{ borderBottom: "1px solid #F1F5F9", transition: "background 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: "16px 20px", color: "#64748B", fontSize: 14 }}>{(page - 1) * limit + i + 1}</td>
                      <td style={{ padding: "16px 20px", fontWeight: 600, color: "#475569", fontSize: 14 }}>{u.kd_upt || "-"}</td>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 8, background: u.type === "RSUD" ? "#EEF2FF" : u.type === "Dinas" ? "#FEF3C7" : "#F0FDF4", color: u.type === "RSUD" ? "#4F46E5" : u.type === "Dinas" ? "#D97706" : "#16A34A", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>
                            {u.nm_upt ? u.nm_upt.charAt(0).toUpperCase() : "U"}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: "#0F172A", fontSize: 14 }}>{u.nm_upt}</div>
                            {u.email && <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>{u.email}</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <span style={{ padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 500, background: u.type === "RSUD" ? "#EEF2FF" : u.type === "Dinas" ? "#FEF3C7" : "#F0FDF4", color: u.type === "RSUD" ? "#4F46E5" : u.type === "Dinas" ? "#D97706" : "#16A34A" }}>
                          {u.type}
                        </span>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ fontSize: 14, color: "#334155" }}>{u.kecamatan || u.kabupaten || "-"}</div>
                        <div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>{u.alamat || "Tidak ada detail alamat"}</div>
                      </td>
                      <td style={{ padding: "16px 20px" }}>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 500, background: u.status === 1 ? "#ECFDF5" : "#FEF2F2", color: u.status === 1 ? "#059669" : "#DC2626", border: `1px solid ${u.status === 1 ? "#A7F3D0" : "#FECACA"}` }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: u.status === 1 ? "#10B981" : "#EF4444" }}></span>
                          {u.status === 1 ? "Aktif" : "Non-Aktif"}
                        </div>
                      </td>
                      <td style={{ padding: "16px 20px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                          <button className="btn btn-ghost btn-sm" style={{ padding: 8, borderRadius: 6, background: "#F1F5F9", border: "1px solid #E2E8F0" }} onClick={() => handleEdit(u)} title="Edit">
                            <Edit2 size={15} color="#3B82F6" />
                          </button>
                          <button className="btn btn-ghost btn-sm" style={{ padding: 8, borderRadius: 6, background: "#FEF2F2", border: "1px solid #FECACA" }} onClick={() => handleDelete(u.id)} title="Hapus">
                            <Trash2 size={15} color="#EF4444" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderTop: "1px solid #E2E8F0", background: "#fff" }}>
              <div style={{ fontSize: 13, color: "#64748B" }}>
                Menampilkan <span style={{ fontWeight: 600, color: "#0F172A" }}>{total === 0 ? 0 : (page - 1) * limit + 1}</span> sampai <span style={{ fontWeight: 600, color: "#0F172A" }}>{Math.min(page * limit, total)}</span> dari <span style={{ fontWeight: 600, color: "#0F172A" }}>{total}</span> data
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, color: "#64748B" }}>Baris per halaman:</span>
                  <select 
                    className="form-select" 
                    style={{ padding: "4px 28px 4px 12px", fontSize: 13, height: 32, borderRadius: 6 }}
                    value={limit}
                    onChange={(e) => { setLimit(parseInt(e.target.value)); setPage(1); }}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
                
                <div style={{ display: "flex", gap: 4 }}>
                  <button 
                    style={{ padding: 6, borderRadius: 6, border: "1px solid #E2E8F0", background: page === 1 ? "#F8FAFC" : "#fff", cursor: page === 1 ? "not-allowed" : "pointer", color: page === 1 ? "#CBD5E1" : "#475569" }}
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button 
                    style={{ padding: 6, borderRadius: 6, border: "1px solid #E2E8F0", background: page === totalPages || totalPages === 0 ? "#F8FAFC" : "#fff", cursor: page === totalPages || totalPages === 0 ? "not-allowed" : "pointer", color: page === totalPages || totalPages === 0 ? "#CBD5E1" : "#475569" }}
                    disabled={page === totalPages || totalPages === 0}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal animate-fadein" style={{ width: "100%", maxWidth: 650, padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #E2E8F0", background: "#fff" }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", display: "flex", alignItems: "center", gap: 8 }}>
                <Building2 size={20} color="#3B82F6" />
                {editingId ? "Edit Data UPT" : "Tambah UPT Baru"}
              </h3>
              <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>
                Silakan lengkapi informasi formulir di bawah ini dengan benar. Tanda (*) wajib diisi.
              </p>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 24, maxHeight: "calc(100vh - 200px)", overflowY: "auto" }}>
                
                {/* Group 1: Informasi Dasar */}
                <div style={{ background: "#F8FAFC", padding: 16, borderRadius: 8, border: "1px solid #E2E8F0" }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: "#334155", marginBottom: 16 }}>Informasi Dasar</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16, marginBottom: 16 }}>
                    <div>
                      <label className="form-label" style={{ fontSize: 13, fontWeight: 500 }}>Kode UPT</label>
                      <input type="text" className="form-input" style={{ width: "100%" }} value={form.kd_upt} onChange={(e) => setForm({ ...form, kd_upt: e.target.value })} placeholder="Cth: P1234" />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: 13, fontWeight: 500 }}>Tipe UPT <span style={{ color: "#EF4444" }}>*</span></label>
                      <select className="form-select" style={{ width: "100%" }} required value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                        <option value="Puskesmas">Puskesmas</option>
                        <option value="RSUD">RSUD</option>
                        <option value="Dinas">Dinas Terkait</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: 13, fontWeight: 500 }}>Nama UPT <span style={{ color: "#EF4444" }}>*</span></label>
                    <input type="text" className="form-input" style={{ width: "100%" }} required value={form.nm_upt} onChange={(e) => setForm({ ...form, nm_upt: e.target.value })} placeholder="Cth: Puskesmas Melati" />
                  </div>
                </div>

                {/* Group 2: Kontak & Lokasi */}
                <div style={{ background: "#F8FAFC", padding: 16, borderRadius: 8, border: "1px solid #E2E8F0" }}>
                  <h4 style={{ fontSize: 14, fontWeight: 600, color: "#334155", marginBottom: 16 }}>Kontak & Lokasi</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                    <div>
                      <label className="form-label" style={{ fontSize: 13, fontWeight: 500 }}>Email</label>
                      <input type="email" className="form-input" style={{ width: "100%" }} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@contoh.com" />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: 13, fontWeight: 500 }}>No. Telepon</label>
                      <input type="tel" className="form-input" style={{ width: "100%" }} value={form.no_tlp} onChange={(e) => setForm({ ...form, no_tlp: e.target.value })} placeholder="0812xxxx" />
                    </div>
                  </div>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                    <div>
                      <label className="form-label" style={{ fontSize: 13, fontWeight: 500 }}>Kecamatan</label>
                      <input type="text" className="form-input" style={{ width: "100%" }} value={form.kecamatan} onChange={(e) => setForm({ ...form, kecamatan: e.target.value })} placeholder="Nama Kecamatan" />
                    </div>
                    <div>
                      <label className="form-label" style={{ fontSize: 13, fontWeight: 500 }}>Kabupaten/Kota</label>
                      <input type="text" className="form-input" style={{ width: "100%" }} value={form.kabupaten} onChange={(e) => setForm({ ...form, kabupaten: e.target.value })} placeholder="Nama Kabupaten" />
                    </div>
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: 13, fontWeight: 500 }}>Alamat Lengkap</label>
                    <textarea className="form-input" style={{ width: "100%", resize: "vertical" }} rows={2} value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} placeholder="Jalan, RT/RW, Desa..." />
                  </div>
                </div>

                {/* Group 3: Pengaturan */}
                <div style={{ background: "#F8FAFC", padding: 16, borderRadius: 8, border: "1px solid #E2E8F0" }}>
                  <div>
                    <label className="form-label" style={{ fontSize: 13, fontWeight: 500 }}>Status Operasional <span style={{ color: "#EF4444" }}>*</span></label>
                    <select className="form-select" style={{ width: "100%" }} value={form.status} onChange={(e) => setForm({ ...form, status: parseInt(e.target.value) })}>
                      <option value={1}>Aktif (Beroperasi)</option>
                      <option value={0}>Non-Aktif (Tutup / Suspend)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ padding: "16px 24px", borderTop: "1px solid #E2E8F0", background: "#F8FAFC", display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)} style={{ padding: "8px 16px" }}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ padding: "8px 24px", fontWeight: 600 }}>
                  {submitting ? (
                    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div className="loading-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> 
                      Menyimpan...
                    </span>
                  ) : "Simpan Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
