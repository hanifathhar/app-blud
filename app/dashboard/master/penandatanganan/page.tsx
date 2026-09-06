"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Edit2, Trash2, FileSignature, CheckCircle, XCircle, ChevronLeft, ChevronRight, UserCheck, Shield } from "lucide-react";
import Select from "react-select";
import Swal from "sweetalert2";

interface Penandatangan {
  id: number;
  kd_upt: string;
  nm_upt: string | null;
  kode: number;
  jabatan: string;
  nama: string;
  nip: string | null;
  pangkat_golongan: string | null;
  status: number;
  created_at?: string;
  updated_at?: string;
}

interface UPT {
  id: number;
  kd_upt: string | null;
  nm_upt: string | null;
}

const JABATAN_OPTIONS = [
  { kode: 1, label: "Kuasa Pengguna Anggaran (KPA)", short: "KPA", color: "#3B82F6", bg: "#EFF6FF", border: "#BFDBFE" },
  { kode: 2, label: "Pejabat Pelaksana Teknis Kegiatan (PPTK)", short: "PPTK", color: "#10B981", bg: "#ECFDF5", border: "#A7F3D0" },
  { kode: 3, label: "Subag Keuangan", short: "Subag Keuangan", color: "#F59E0B", bg: "#FFFBEB", border: "#FDE68A" },
  { kode: 4, label: "Bendahara Penerimaan", short: "Bendahara Penerimaan", color: "#8B5CF6", bg: "#F5F3FF", border: "#DDD6FE" },
  { kode: 5, label: "Bendahara Pengeluaran", short: "Bendahara Pengeluaran", color: "#EF4444", bg: "#FEF2F2", border: "#FECACA" },
];

export default function MasterPenandatangananPage() {
  const [list, setList] = useState<Penandatangan[]>([]);
  const [upts, setUpts] = useState<UPT[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [filterUpt, setFilterUpt] = useState("");
  const [filterKode, setFilterKode] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [form, setForm] = useState({
    kd_upt: "",
    nm_upt: "",
    kode: 1,
    jabatan: "Kuasa Pengguna Anggaran (KPA)",
    nama: "",
    nip: "",
    pangkat_golongan: "",
    status: 1,
  });

  // Load User & Master UPT
  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        const u = d.user || null;
        setUser(u);
        if (u && u.kd_upt && u.role !== "superadmin" && u.level !== 1) {
          setFilterUpt(u.kd_upt);
          setForm((prev) => ({ ...prev, kd_upt: u.kd_upt, nm_upt: u.nm_upt || "" }));
        }
      });

    fetch("/api/upt")
      .then((r) => r.json())
      .then((d) => setUpts(d.data || []));
  }, []);

  const loadData = () => {
    setLoading(true);
    let url = `/api/master/penandatangan?q=${encodeURIComponent(search)}&page=${page}&limit=${limit}`;
    if (filterUpt) url += `&kd_upt=${encodeURIComponent(filterUpt)}`;
    if (filterKode) url += `&kode=${filterKode}`;
    if (filterStatus !== "") url += `&status=${filterStatus}`;

    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        setList(d.data || []);
        if (d.pagination) {
          setTotal(d.pagination.total);
          setTotalPages(d.pagination.totalPages);
        }
      })
      .catch((err) => console.error("Error loading penandatangan:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setPage(1);
  }, [search, filterUpt, filterKode, filterStatus]);

  useEffect(() => {
    loadData();
  }, [search, filterUpt, filterKode, filterStatus, page, limit]);

  const handleOpenAdd = () => {
    setEditingId(null);
    const defaultKdUpt = user && (user.role !== "superadmin" && user.level !== 1) ? (user.kd_upt || "") : (filterUpt || "");
    const defaultNmUpt = upts.find((u) => u.kd_upt === defaultKdUpt)?.nm_upt || "";
    setForm({
      kd_upt: defaultKdUpt,
      nm_upt: defaultNmUpt,
      kode: 1,
      jabatan: JABATAN_OPTIONS[0].label,
      nama: "",
      nip: "",
      pangkat_golongan: "",
      status: 1,
    });
    setShowForm(true);
  };

  const handleEdit = (item: Penandatangan) => {
    setEditingId(item.id);
    setForm({
      kd_upt: item.kd_upt,
      nm_upt: item.nm_upt || "",
      kode: item.kode,
      jabatan: item.jabatan,
      nama: item.nama,
      nip: item.nip || "",
      pangkat_golongan: item.pangkat_golongan || "",
      status: item.status,
    });
    setShowForm(true);
  };

  const handleKodeChange = (kodeVal: number) => {
    const matched = JABATAN_OPTIONS.find((j) => j.kode === kodeVal);
    setForm((prev) => ({
      ...prev,
      kode: kodeVal,
      jabatan: matched ? matched.label : prev.jabatan,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.kd_upt) {
      Swal.fire("Peringatan", "Silakan pilih unit UPT terlebih dahulu!", "warning");
      return;
    }
    if (!form.nama.trim()) {
      Swal.fire("Peringatan", "Nama lengkap pejabat wajib diisi!", "warning");
      return;
    }

    setSubmitting(true);
    try {
      const url = "/api/master/penandatangan";
      const method = editingId ? "PUT" : "POST";
      const payload = editingId ? { id: editingId, ...form } : form;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: data.message || "Data penandatangan berhasil disimpan",
          timer: 1500,
          showConfirmButton: false,
        });
        setShowForm(false);
        setEditingId(null);
        loadData();
      } else {
        Swal.fire("Gagal", data.error || "Gagal menyimpan data", "error");
      }
    } catch (err: any) {
      Swal.fire("Error", err.message || "Terjadi kesalahan server", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, nama: string) => {
    const result = await Swal.fire({
      title: "Hapus Penandatangan?",
      html: `Apakah Anda yakin ingin menghapus data <b>${nama}</b>?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/master/penandatangan?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (res.ok) {
        Swal.fire("Terhapus!", data.message || "Data penandatangan berhasil dihapus.", "success");
        loadData();
      } else {
        Swal.fire("Gagal!", data.error || "Gagal menghapus data", "error");
      }
    } catch (err: any) {
      Swal.fire("Error", err.message || "Terjadi kesalahan koneksi", "error");
    }
  };

  const isSuperAdmin = user?.role === "superadmin" || user?.level === 1;

  return (
    <div className="animate-fadein">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ padding: "8px", background: "#EEF2FF", borderRadius: "10px", color: "#4F46E5" }}>
              <FileSignature size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", margin: 0 }}>Master Penandatanganan</h1>
              <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>
                Pengaturan Pejabat Penandatangan Dokumen (KPA, PPTK, Subag Keuangan, Bendahara Penerimaan, & Bendahara Pengeluaran) per UPT
              </p>
            </div>
          </div>
        </div>

        <div>
          <button className="btn btn-primary" onClick={handleOpenAdd} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Plus size={16} /> Tambah Penandatangan
          </button>
        </div>
      </div>

      {/* Main Card */}
      <div className="card">
        {/* Filter Section */}
        <div className="card-header" style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", borderBottom: "1px solid #F1F5F9", paddingBottom: 16 }}>
          {/* Filter UPT (Hanya untuk Superadmin) */}
          {isSuperAdmin && (
            <div style={{ minWidth: 260, flex: 1, maxWidth: 350 }}>
              <Select
                options={upts.map((u) => ({ value: u.kd_upt || "", label: `${u.kd_upt ? `[${u.kd_upt}] ` : ""}${u.nm_upt}` }))}
                value={filterUpt ? { value: filterUpt, label: upts.find((u) => u.kd_upt === filterUpt)?.nm_upt || filterUpt } : null}
                onChange={(selected: any) => setFilterUpt(selected?.value || "")}
                placeholder="-- Semua Unit UPT --"
                isClearable
                menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                styles={{
                  control: (base) => ({ ...base, borderColor: "#E2E8F0", borderRadius: "0.5rem", minHeight: "40px", fontSize: "13px" }),
                  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                }}
              />
            </div>
          )}

          {/* Filter Jabatan */}
          <div style={{ minWidth: 190 }}>
            <select
              className="form-input"
              value={filterKode}
              onChange={(e) => setFilterKode(e.target.value)}
              style={{ minHeight: "40px", fontSize: "13px" }}
            >
              <option value="">-- Semua Jabatan --</option>
              {JABATAN_OPTIONS.map((j) => (
                <option key={j.kode} value={j.kode}>
                  {j.kode}. {j.short}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status */}
          <div style={{ minWidth: 140 }}>
            <select
              className="form-input"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ minHeight: "40px", fontSize: "13px" }}
            >
              <option value="">-- Semua Status --</option>
              <option value="1">Aktif</option>
              <option value="0">Nonaktif</option>
            </select>
          </div>

          {/* Search Box */}
          <div style={{ flex: 1, minWidth: 220, position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 36, minHeight: "40px", fontSize: "13px" }}
              placeholder="Cari Nama, NIP, Jabatan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table View */}
        <div className="tbl-wrap" style={{ marginTop: 8 }}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 45, textAlign: "center" }}>No</th>
                <th style={{ width: 220 }}>Unit UPT</th>
                <th style={{ width: 70, textAlign: "center" }}>Kode</th>
                <th style={{ width: 210 }}>Jabatan Penandatangan</th>
                <th>Nama Lengkap & NIP</th>
                <th style={{ width: 180 }}>Pangkat / Golongan</th>
                <th style={{ width: 100, textAlign: "center" }}>Status</th>
                <th style={{ width: 100, textAlign: "center" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center p-8 text-gray-500">
                    <div className="loading-spinner" style={{ margin: "0 auto 8px" }} />
                    <span style={{ fontSize: 13 }}>Memuat data penandatangan...</span>
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-8 text-gray-500">
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                      <FileSignature size={36} style={{ color: "#CBD5E1" }} />
                      <span style={{ fontWeight: 600, color: "#64748B" }}>Belum ada data penandatangan</span>
                      <span style={{ fontSize: 12, color: "#94A3B8" }}>Klik tombol "Tambah Penandatangan" untuk menambahkan data baru.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                list.map((item, idx) => {
                  const jOpt = JABATAN_OPTIONS.find((j) => j.kode === item.kode) || JABATAN_OPTIONS[0];
                  return (
                    <tr key={item.id}>
                      <td style={{ textAlign: "center", color: "#64748B", fontSize: 13 }}>
                        {(page - 1) * limit + idx + 1}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: "#1E293B", fontSize: 13 }}>
                          {item.nm_upt || item.kd_upt}
                        </div>
                        {item.kd_upt && (
                          <div style={{ fontSize: 11, color: "#64748B", fontFamily: "monospace" }}>
                            Kode: {item.kd_upt}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-block",
                            width: 26,
                            height: 26,
                            lineHeight: "26px",
                            borderRadius: "50%",
                            background: jOpt.bg,
                            color: jOpt.color,
                            fontWeight: 700,
                            fontSize: 12,
                            border: `1px solid ${jOpt.border}`,
                          }}
                        >
                          {item.kode}
                        </span>
                      </td>
                      <td>
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            padding: "3px 10px",
                            borderRadius: "6px",
                            background: jOpt.bg,
                            color: jOpt.color,
                            border: `1px solid ${jOpt.border}`,
                            fontWeight: 600,
                            fontSize: 12,
                          }}
                        >
                          {item.jabatan}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: "#0F172A", fontSize: 13 }}>
                          {item.nama}
                        </div>
                        {item.nip ? (
                          <div style={{ fontSize: 12, color: "#64748B", marginTop: 1 }}>
                            NIP. {item.nip}
                          </div>
                        ) : (
                          <div style={{ fontSize: 11, color: "#94A3B8", fontStyle: "italic" }}>
                            - Tidak ada NIP -
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: 12, color: "#334155" }}>
                          {item.pangkat_golongan || "-"}
                        </div>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {item.status === 1 ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "2px 8px",
                              borderRadius: "12px",
                              background: "#DCFCE7",
                              color: "#166534",
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            <CheckCircle size={12} /> Aktif
                          </span>
                        ) : (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 4,
                              padding: "2px 8px",
                              borderRadius: "12px",
                              background: "#F1F5F9",
                              color: "#64748B",
                              fontSize: 11,
                              fontWeight: 600,
                            }}
                          >
                            <XCircle size={12} /> Nonaktif
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: "flex", gap: 6, justifyContent: "center", alignItems: "center" }}>
                          <button
                            onClick={() => handleEdit(item)}
                            className="btn btn-outline btn-sm"
                            title="Edit Data"
                            style={{ padding: "4px 8px" }}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.nama)}
                            className="btn btn-outline btn-sm"
                            title="Hapus Data"
                            style={{ padding: "4px 8px", color: "#EF4444", borderColor: "#FECACA" }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            borderTop: "1px solid #F1F5F9",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 13, color: "#64748B" }}>
            Menampilkan <b>{list.length}</b> dari total <b>{total}</b> data
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              className="btn btn-outline btn-sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              style={{ display: "flex", alignItems: "center", gap: 4 }}
            >
              <ChevronLeft size={14} /> Sebelumnya
            </button>
            <span style={{ fontSize: 13, color: "#475569", padding: "0 8px" }}>
              Halaman <b>{page}</b> dari <b>{totalPages || 1}</b>
            </span>
            <button
              className="btn btn-outline btn-sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              style={{ display: "flex", alignItems: "center", gap: 4 }}
            >
              Berikutnya <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Dialog Tambah / Edit */}
      {showForm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            className="card"
            style={{
              width: "100%",
              maxWidth: 560,
              background: "#FFFFFF",
              borderRadius: 14,
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid #E2E8F0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#F8FAFC",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ padding: "6px", background: "#EEF2FF", borderRadius: "8px", color: "#4F46E5" }}>
                  <FileSignature size={18} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0 }}>
                  {editingId ? "Edit Penandatangan" : "Tambah Penandatangan Baru"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 18,
                  fontWeight: "bold",
                  color: "#94A3B8",
                  cursor: "pointer",
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit}>
              <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
                {/* UPT Selection */}
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                    Unit Pelaksana Teknis (UPT) <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  {isSuperAdmin ? (
                    <Select
                      options={upts.map((u) => ({ value: u.kd_upt || "", label: `${u.kd_upt ? `[${u.kd_upt}] ` : ""}${u.nm_upt}` }))}
                      value={form.kd_upt ? { value: form.kd_upt, label: upts.find((u) => u.kd_upt === form.kd_upt)?.nm_upt || form.kd_upt } : null}
                      onChange={(selected: any) => {
                        const selUpt = upts.find((u) => u.kd_upt === selected?.value);
                        setForm((prev) => ({
                          ...prev,
                          kd_upt: selected?.value || "",
                          nm_upt: selUpt?.nm_upt || "",
                        }));
                      }}
                      placeholder="-- Pilih Unit UPT --"
                      isClearable
                      menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                      styles={{
                        control: (base) => ({ ...base, borderColor: "#CBD5E1", borderRadius: "0.5rem", minHeight: "42px", fontSize: "13px" }),
                        menuPortal: (base) => ({ ...base, zIndex: 10000 }),
                      }}
                    />
                  ) : (
                    <input
                      type="text"
                      className="form-input"
                      value={form.nm_upt || form.kd_upt}
                      disabled
                      style={{ background: "#F1F5F9", color: "#64748B", cursor: "not-allowed" }}
                    />
                  )}
                </div>

                {/* Kode & Jabatan Selector */}
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                    Jabatan Penandatangan <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <select
                    className="form-input"
                    value={form.kode}
                    onChange={(e) => handleKodeChange(parseInt(e.target.value))}
                    style={{ minHeight: "42px", fontSize: "13px" }}
                  >
                    {JABATAN_OPTIONS.map((j) => (
                      <option key={j.kode} value={j.kode}>
                        {j.kode} - {j.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom Label Jabatan (Opsional) */}
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                    Label / Keterangan Jabatan
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Kuasa Pengguna Anggaran (KPA)"
                    value={form.jabatan}
                    onChange={(e) => setForm({ ...form, jabatan: e.target.value })}
                  />
                  <span style={{ fontSize: 11, color: "#94A3B8", marginTop: 4, display: "block" }}>
                    Dapat disesuaikan jika memiliki sebutan jabatan spesifik pada naskah dokumen.
                  </span>
                </div>

                {/* Nama Pejabat */}
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                    Nama Lengkap & Gelar <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Dr. H. Ahmad Sudrajat, M.Kes"
                    value={form.nama}
                    onChange={(e) => setForm({ ...form, nama: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                  {/* NIP */}
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                      NIP
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Contoh: 19780101 200501 1 002"
                      value={form.nip}
                      onChange={(e) => setForm({ ...form, nip: e.target.value })}
                    />
                  </div>

                  {/* Pangkat / Golongan */}
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                      Pangkat / Golongan
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Contoh: Pembina / IV.a"
                      value={form.pangkat_golongan}
                      onChange={(e) => setForm({ ...form, pangkat_golongan: e.target.value })}
                    />
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
                    Status Pejabat
                  </label>
                  <div style={{ display: "flex", gap: 20, marginTop: 4 }}>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="status"
                        checked={form.status === 1}
                        onChange={() => setForm({ ...form, status: 1 })}
                      />
                      <span>Aktif</span>
                    </label>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                      <input
                        type="radio"
                        name="status"
                        checked={form.status === 0}
                        onChange={() => setForm({ ...form, status: 0 })}
                      />
                      <span>Nonaktif</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  padding: "14px 20px",
                  background: "#F8FAFC",
                  borderTop: "1px solid #E2E8F0",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 10,
                }}
              >
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowForm(false)}
                  disabled={submitting}
                >
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Tambahkan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
