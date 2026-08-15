"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Trash2, CheckCircle2, Eye, XCircle } from "lucide-react";
import Select from "react-select";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

export default function PenetapanRbaPage() {
  const router = useRouter();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const [user, setUser] = useState<any>(null);
  const [upts, setUpts] = useState<any[]>([]);
  const [filterUpt, setFilterUpt] = useState("");

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    kdUnit: "",
    nomor_penetapan: "",
    tanggal_penetapan: "",
    keterangan: ""
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/me").then(r => r.json()).then(d => {
      if (d.user) {
        setUser(d.user);
        if (d.user.role === "superadmin") {
          fetch("/api/master/upt?limit=100").then(r => r.json()).then(res => setUpts(res.data || []));
        } else {
          setFilterUpt(d.user.kd_upt);
          setForm(prev => ({ ...prev, kdUnit: d.user.kd_upt }));
        }
      }
    }).catch(e => console.error("Gagal load user", e));
  }, []);

  const loadData = () => {
    setLoading(true);
    const query = new URLSearchParams({ 
      q, 
      page: page.toString(), 
      limit: limit.toString() 
    });
    if (filterUpt) query.append("kd_upt", filterUpt);

    fetch(`/api/perencanaan/penetapan-rba?${query.toString()}`)
      .then(r => r.json())
      .then(d => {
        setList(d.data || []);
        if (d.pagination) {
          setTotal(d.pagination.total || 0);
          setTotalPages(d.pagination.totalPages || 1);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user) loadData();
  }, [q, filterUpt, page, limit, user]);

  const openModal = () => {
    setForm({
      kdUnit: user?.role === "superadmin" ? "" : user?.kd_upt,
      nomor_penetapan: "",
      tanggal_penetapan: new Date().toISOString().split("T")[0],
      keterangan: ""
    });
    setShowModal(true);
  };

  const handlePosting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.kdUnit) return alert("Pilih UPT terlebih dahulu");
    if (!form.nomor_penetapan) return alert("Nomor Penetapan harus diisi");

    setSubmitting(true);
    try {
      const res = await fetch("/api/perencanaan/penetapan-rba", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      Swal.fire({
        icon: "success",
        title: "Sukses!",
        text: data.message || "Penetapan RBA berhasil diposting!",
        timer: 2000,
        showConfirmButton: false
      });
      setShowModal(false);
      loadData();
    } catch (e: any) {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: e.message || "Gagal memposting penetapan RBA"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (kdUnit: string, nomor_penetapan: string) => {
    const result = await Swal.fire({
      title: "Batalkan Penetapan?",
      text: `Penetapan dengan nomor: ${nomor_penetapan} akan dibatalkan.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#64748B",
      confirmButtonText: "Ya, Batalkan",
      cancelButtonText: "Tidak"
    });

    if (!result.isConfirmed) return;

    try {
      const query = new URLSearchParams({ kdUnit, nomor_penetapan });
      const res = await fetch(`/api/perencanaan/penetapan-rba?${query.toString()}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Penetapan berhasil dibatalkan!",
        timer: 1500,
        showConfirmButton: false
      });
      if (list.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        loadData();
      }
    } catch (e: any) {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: e.message || "Gagal membatalkan penetapan"
      });
    }
  };

  const handleAktifkan = async (kdUnit: string, nomor_penetapan: string) => {
    const result = await Swal.fire({
      title: "Aktifkan Penetapan?",
      text: "Penetapan ini akan menjadi acuan aktif untuk penatausahaan.",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3B82F6",
      cancelButtonColor: "#64748B",
      confirmButtonText: "Ya, Aktifkan",
      cancelButtonText: "Batal"
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch("/api/perencanaan/penetapan-rba", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kdUnit, nomor_penetapan })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Penetapan berhasil diaktifkan!",
        timer: 1500,
        showConfirmButton: false
      });
      loadData();
    } catch (e: any) {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: e.message || "Gagal mengaktifkan penetapan"
      });
    }
  };

  const handleNonaktifkan = async (kdUnit: string, nomor_penetapan: string) => {
    const result = await Swal.fire({
      title: "Nonaktifkan Penetapan?",
      text: "Penetapan ini tidak akan lagi menjadi acuan untuk penatausahaan.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#F59E0B",
      cancelButtonColor: "#64748B",
      confirmButtonText: "Ya, Nonaktifkan",
      cancelButtonText: "Batal"
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch("/api/perencanaan/penetapan-rba", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kdUnit, nomor_penetapan, action: "deactivate" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Penetapan berhasil dinonaktifkan!",
        timer: 1500,
        showConfirmButton: false
      });
      loadData();
    } catch (e: any) {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: e.message || "Gagal menonaktifkan penetapan"
      });
    }
  };

  const handleDetail = (kdUnit: string, nomor_penetapan: string) => {
    router.push(`/dashboard/perencanaan/penetapan-rba/${kdUnit}/${encodeURIComponent(nomor_penetapan)}`);
  };

  const formInputStyle = { background: "#F8FAFC", width: "100%", fontSize: 13, borderRadius: 6, border: "1px solid #E2E8F0", padding: "8px 12px" };

  return (
    <div className="animate-fadein relative">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>🎯 Penetapan RBA</h1>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn btn-primary" onClick={openModal}>
            <Plus size={16} /> Buat Penetapan
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Riwayat Penetapan</span>
        </div>

        {/* Filter Area matching RBA UI exactly */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569", zIndex: 10 }}>
              Show
              <div style={{ width: 70 }}>
                <Select instanceId="limit-select" menuPosition="fixed" options={[
                  { value: 10, label: "10" },
                  { value: 25, label: "25" },
                  { value: 50, label: "50" },
                  { value: 100, label: "100" }
                ]}
                  value={{ value: limit, label: limit.toString() }}
                  onChange={(v: any) => { setLimit(v.value); setPage(1); }}
                  styles={{ control: (b) => ({ ...b, minHeight: 34, borderRadius: 4, borderColor: "#E2E8F0", boxShadow: "none" }) }}
                />
              </div>
              entries
            </div>

            {user?.role === "superadmin" && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569", zIndex: 10 }}>
                Filter UPT:
                <div style={{ width: 220 }}>
                  <Select
                    instanceId="upt-select"
                    placeholder="Semua UPT"
                    isClearable
                    options={upts.map((u: any) => ({ value: u.kd_upt, label: u.nm_upt }))}
                    value={filterUpt ? { value: filterUpt, label: upts.find(u => u.kd_upt === filterUpt)?.nm_upt || filterUpt } : null}
                    onChange={(v: any) => { setFilterUpt(v?.value || ""); setPage(1); }}
                    styles={{ control: (b) => ({ ...b, minHeight: 34, borderRadius: 4, borderColor: "#E2E8F0", boxShadow: "none" }) }}
                  />
                </div>
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569" }}>
            Search:
            <input
              type="text"
              placeholder="Cari penetapan..."
              style={{ ...formInputStyle, width: 220, padding: "6px 12px", borderRadius: 4, minHeight: 34 }}
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {/* Table Content matching RBA UI exactly */}
        {loading ? (
          <div className="empty-state" style={{ padding: 48 }}><div className="loading-spinner" /></div>
        ) : list.length === 0 ? (
          <div className="empty-state" style={{ padding: 48, fontSize: 13, color: "#64748B" }}>Tidak ada data penetapan.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", borderTop: "1px solid #E2E8F0", borderBottom: "1px solid #E2E8F0" }}>
              <thead style={{ backgroundColor: "#F8FAFC" }}>
                <tr>
                  <th style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#1E293B", textTransform: "uppercase", textAlign: "center", width: 50, borderBottom: "1px solid #E2E8F0" }}>NO.</th>
                  <th style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#1E293B", textTransform: "uppercase", textAlign: "left", whiteSpace: "nowrap", borderBottom: "1px solid #E2E8F0" }}>NOMOR PENETAPAN</th>
                  <th style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#1E293B", textTransform: "uppercase", textAlign: "left", whiteSpace: "nowrap", borderBottom: "1px solid #E2E8F0" }}>NAMA UPT</th>
                  <th style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#1E293B", textTransform: "uppercase", textAlign: "left", whiteSpace: "nowrap", borderBottom: "1px solid #E2E8F0" }}>TGL. PENETAPAN</th>
                  <th style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#1E293B", textTransform: "uppercase", textAlign: "left", minWidth: 200, borderBottom: "1px solid #E2E8F0" }}>KETERANGAN</th>
                  <th style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#1E293B", textTransform: "uppercase", textAlign: "center", borderBottom: "1px solid #E2E8F0" }}>STATUS</th>
                  <th style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#1E293B", textTransform: "uppercase", textAlign: "center", whiteSpace: "nowrap", borderBottom: "1px solid #E2E8F0" }}>JML RBA</th>
                  <th style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#1E293B", textTransform: "uppercase", textAlign: "right", whiteSpace: "nowrap", borderBottom: "1px solid #E2E8F0" }}>PENDAPATAN (RP)</th>
                  <th style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#1E293B", textTransform: "uppercase", textAlign: "right", whiteSpace: "nowrap", borderBottom: "1px solid #E2E8F0" }}>BELANJA (RP)</th>
                  <th style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#1E293B", textTransform: "uppercase", textAlign: "center", borderBottom: "1px solid #E2E8F0" }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {list.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #F1F5F9" }} className="hover:bg-slate-50/50">
                    <td style={{ padding: "16px 16px", fontSize: 12, color: "#475569", textAlign: "center", verticalAlign: "top" }}>
                      {((page - 1) * limit) + idx + 1}
                    </td>
                    <td style={{ padding: "16px 16px", fontSize: 12, color: "#0F172A", fontWeight: 500, verticalAlign: "top" }}>
                      {item.nomor_penetapan}
                    </td>
                    <td style={{ padding: "16px 16px", fontSize: 12, color: "#0F172A", fontWeight: 500, verticalAlign: "top" }}>
                      {item.nmUnit}
                    </td>
                    <td style={{ padding: "16px 16px", fontSize: 12, color: "#475569", verticalAlign: "top" }}>
                      {item.tanggal_penetapan ? new Date(item.tanggal_penetapan).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}
                    </td>
                    <td style={{ padding: "16px 16px", fontSize: 12, color: "#475569", verticalAlign: "top", maxWidth: 250, wordWrap: "break-word" }}>
                      {item.keterangan || "-"}
                    </td>
                    <td style={{ padding: "16px 16px", textAlign: "center", verticalAlign: "top" }}>
                      {item.is_aktif ? (
                        <span style={{ backgroundColor: "#DCFCE7", color: "#166534", padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>Aktif</span>
                      ) : (
                        <span style={{ backgroundColor: "#F1F5F9", color: "#64748B", padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 500 }}>Non Aktif</span>
                      )}
                    </td>
                    <td style={{ padding: "16px 16px", fontSize: 12, color: "#0F172A", fontWeight: 600, textAlign: "center", verticalAlign: "top" }}>
                      {item.jumlah_rba}
                    </td>
                    <td style={{ padding: "16px 16px", fontSize: 12, color: "#0F172A", fontWeight: 700, textAlign: "right", verticalAlign: "top" }}>
                      {new Intl.NumberFormat('id-ID').format(item.total_pendapatan || 0)}
                    </td>
                    <td style={{ padding: "16px 16px", fontSize: 12, color: "#0F172A", fontWeight: 700, textAlign: "right", verticalAlign: "top" }}>
                      {new Intl.NumberFormat('id-ID').format(item.total_belanja || 0)}
                    </td>
                    <td style={{ padding: "16px 16px", textAlign: "center", verticalAlign: "top" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        {!item.is_aktif ? (
                          <button 
                            onClick={() => handleAktifkan(item.kdUnit, item.nomor_penetapan)} 
                            title="Aktifkan Penetapan"
                            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 4, border: "1px solid #BBF7D0", backgroundColor: "#F0FDF4", color: "#22C55E", cursor: "pointer" }}
                          >
                            <CheckCircle2 size={14} />
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleNonaktifkan(item.kdUnit, item.nomor_penetapan)} 
                            title="Nonaktifkan Penetapan"
                            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 4, border: "1px solid #FDE68A", backgroundColor: "#FEF3C7", color: "#D97706", cursor: "pointer" }}
                          >
                            <XCircle size={14} />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDetail(item.kdUnit, item.nomor_penetapan)} 
                          title="Detail Penetapan"
                          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 4, border: "1px solid #BFDBFE", backgroundColor: "#EFF6FF", color: "#3B82F6", cursor: "pointer" }}
                        >
                          <Eye size={14} />
                        </button>
                        {!item.is_aktif && (
                          <button 
                            onClick={() => handleDelete(item.kdUnit, item.nomor_penetapan)} 
                            title="Batalkan Penetapan"
                            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 4, border: "1px solid #FECACA", backgroundColor: "#FEF2F2", color: "#EF4444", cursor: "pointer" }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls matching RBA UI exactly */}
        {!loading && list.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px" }}>
            <div style={{ fontSize: 13, color: "#64748B" }}>
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} entries
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <button 
                style={{ padding: "6px 12px", border: "1px solid #E2E8F0", borderRadius: 4, fontSize: 13, color: page === 1 ? "#94A3B8" : "#475569", backgroundColor: "#fff", cursor: page === 1 ? "not-allowed" : "pointer" }}
                disabled={page === 1} 
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              
              {/* Pagination Numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                <button
                  key={num}
                  style={{ 
                    padding: "6px 12px", 
                    borderRadius: 4, 
                    fontSize: 13, 
                    fontWeight: 500,
                    cursor: "pointer",
                    border: num === page ? "1px solid #3B82F6" : "1px solid #E2E8F0",
                    backgroundColor: num === page ? "#3B82F6" : "#fff",
                    color: num === page ? "#fff" : "#475569"
                  }}
                  onClick={() => setPage(num)}
                >
                  {num}
                </button>
              ))}

              <button 
                style={{ padding: "6px 12px", border: "1px solid #E2E8F0", borderRadius: 4, fontSize: 13, color: page >= totalPages ? "#94A3B8" : "#475569", backgroundColor: "#fff", cursor: page >= totalPages ? "not-allowed" : "pointer" }}
                disabled={page >= totalPages} 
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Posting */}
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", width: 500, borderRadius: 12, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #E2E8F0" }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", margin: 0 }}>Buat Penetapan Baru</h2>
              <div style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>Posting seluruh RBA dari UPT terpilih</div>
            </div>
            
            <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>
              <form id="penetapanForm" onSubmit={handlePosting} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                
                {user?.role === "superadmin" && (
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#334155" }}>Pilih UPT Target <span style={{ color: "#EF4444" }}>*</span></label>
                    <Select
                      placeholder="Pilih UPT..."
                      options={upts.map((u: any) => ({ value: u.kd_upt, label: u.nm_upt }))}
                      value={form.kdUnit ? { value: form.kdUnit, label: upts.find(u => u.kd_upt === form.kdUnit)?.nm_upt || form.kdUnit } : null}
                      onChange={(v: any) => setForm({ ...form, kdUnit: v?.value || "" })}
                      styles={{ control: (b) => ({ ...b, minHeight: 38, borderRadius: 6, borderColor: "#E2E8F0", boxShadow: "none" }) }}
                    />
                  </div>
                )}

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#334155" }}>Nomor / Tanda Penetapan <span style={{ color: "#EF4444" }}>*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: P-001 / Perubahan 1"
                    style={formInputStyle}
                    value={form.nomor_penetapan}
                    onChange={(e) => setForm({ ...form, nomor_penetapan: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#334155" }}>Tanggal Penetapan <span style={{ color: "#EF4444" }}>*</span></label>
                  <input
                    type="date"
                    required
                    style={formInputStyle}
                    value={form.tanggal_penetapan}
                    onChange={(e) => setForm({ ...form, tanggal_penetapan: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#334155" }}>Keterangan / Catatan</label>
                  <textarea
                    placeholder="Keterangan tambahan (opsional)"
                    rows={3}
                    style={{ ...formInputStyle, resize: "none" }}
                    value={form.keterangan}
                    onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                  />
                  <div style={{ fontSize: 11, color: "#64748B", marginTop: 8, padding: 8, backgroundColor: "#EFF6FF", borderRadius: 6 }}>
                    <strong>Info:</strong> Jika Anda memasukkan nomor penetapan yang sudah ada di UPT ini, maka data lama akan ditimpa (replace) secara otomatis.
                  </div>
                </div>

              </form>
            </div>

            <div style={{ padding: "16px 24px", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "flex-end", gap: 12, backgroundColor: "#F8FAFC", borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)} disabled={submitting}>
                Batal
              </button>
              <button type="submit" form="penetapanForm" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Menyimpan..." : "Posting Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
