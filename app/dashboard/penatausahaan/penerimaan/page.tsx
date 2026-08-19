"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Select from "react-select";
import Swal from "sweetalert2";
import { Plus, CheckCircle, XCircle, Pencil, Trash, FileText, ShieldCheck, Printer, X } from "lucide-react";

function formatRupiah(val: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
}

export default function PenerimaanPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [upts, setUpts] = useState<any[]>([]);
  const [uptFilter, setUptFilter] = useState("");
  const [search, setSearch] = useState("");
  const [totalNilai, setTotalNilai] = useState(0);
  const [totalUnverified, setTotalUnverified] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  // Print Modal State
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showPrintFungsionalModal, setShowPrintFungsionalModal] = useState(false);
  const [printMode, setPrintMode] = useState("bulan"); // "bulan" | "tanggal"
  const [printMonth, setPrintMonth] = useState((new Date().getMonth() + 1).toString());
  const [printYear, setPrintYear] = useState(new Date().getFullYear().toString());
  const [printStartDate, setPrintStartDate] = useState("");
  const [printEndDate, setPrintEndDate] = useState("");
  const [printUpt, setPrintUpt] = useState("");

  const loadData = () => {
    setLoading(true);
    let q = `?page=${page}&limit=${limit}`;
    if (uptFilter) q += `&kd_upt=${uptFilter}`;
    if (search) q += `&search=${search}`;
    // Use user's year implicitly by not sending it, or the API defaults to current year
    
    fetch(`/api/penatausahaan/penerimaan${q}`)
      .then((r) => r.json())
      .then((d) => {
        setList(d.data || []);
        setTotalNilai(d.totalNilai || 0);
        setTotalUnverified(d.totalUnverified || 0);
        setTotalPages(d.pagination?.totalPages || 1);
      })
      .finally(() => setLoading(false));
  };

  // Reset page to 1 on filter change
  useEffect(() => {
    setPage(1);
  }, [uptFilter, search]);

  useEffect(() => {
    fetch("/api/me").then(r => r.json()).then(d => d.user && setUser(d.user));
    fetch("/api/master/upt").then(r => r.json()).then(d => setUpts(d.data || []));
  }, []);

  useEffect(() => {
    if (user) loadData();
  }, [user, uptFilter, search]);

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Hapus Penerimaan?',
      text: "Data yang dihapus tidak dapat dikembalikan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    const res = await fetch(`/api/penatausahaan/penerimaan/${id}`, { method: "DELETE" });
    if (res.ok) {
      Swal.fire('Terhapus!', 'Data penerimaan telah dihapus.', 'success');
      loadData();
    } else {
      const err = await res.json();
      Swal.fire('Gagal!', err.message || "Gagal menghapus data", 'error');
    }
  };

  const handleVerifikasi = async (id: number, action: "verifikasi" | "batal_verifikasi") => {
    const textTitle = action === "verifikasi" ? "Verifikasi Penerimaan?" : "Batalkan Verifikasi?";
    const textMsg = action === "verifikasi" ? "Data akan disahkan!" : "Data akan dikembalikan ke status draf!";
    
    const result = await Swal.fire({
      title: textTitle,
      text: textMsg,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: action === "verifikasi" ? '#10b981' : '#f59e0b',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Lanjutkan',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    const res = await fetch(`/api/penatausahaan/penerimaan/verifikasi`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idTerima: id, action }),
    });
    if (res.ok) {
      Swal.fire('Berhasil!', 'Status berhasil diperbarui.', 'success');
      loadData();
    } else {
      const err = await res.json();
      Swal.fire('Gagal!', err.message || "Gagal memverifikasi data", 'error');
    }
  };

  const handleOpenPrint = () => {
    let url = `/dashboard/penatausahaan/penerimaan/cetak?mode=${printMode}`;
    if (user?.role === "superadmin" && printUpt) url += `&kd_upt=${printUpt}`;
    
    if (printMode === "bulan") {
      url += `&bulan=${printMonth}&tahun=${printYear}`;
    } else {
      if (!printStartDate || !printEndDate) {
        Swal.fire("Peringatan", "Pilih rentang tanggal terlebih dahulu", "warning");
        return;
      }
      url += `&tgl_awal=${printStartDate}&tgl_akhir=${printEndDate}`;
    }
    
    router.push(url);
    setShowPrintModal(false);
  };

  const handleOpenPrintFungsional = () => {
    let url = `/dashboard/penatausahaan/penerimaan/cetak-fungsional?bulan=${printMonth}&tahun=${printYear}`;
    if (user?.role === "superadmin" && printUpt) url += `&kd_upt=${printUpt}`;
    
    router.push(url);
    setShowPrintFungsionalModal(false);
  };

  const canCreate = user && ["superadmin", "bendahara"].includes(user.role);
  const canVerify = user && ["superadmin", "keuangan"].includes(user.role);

  return (
    <div className="animate-fadein">
      {/* Print Modal */}
      {/* Print Modal */}
      {showPrintModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div style={{ backgroundColor: "white", borderRadius: "1rem", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", width: "100%", maxWidth: "32rem", display: "flex", flexDirection: "column", maxHeight: "90vh", overflow: "hidden" }} className="animate-in zoom-in-95 duration-200">
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #f3f4f6", backgroundColor: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#1e293b", fontSize: "1.125rem", fontWeight: "bold", margin: 0 }}>
                <div style={{ backgroundColor: "#dbeafe", color: "#2563eb", padding: "0.5rem", borderRadius: "0.75rem" }}>
                  <Printer size={20} />
                </div>
                Cetak Register Penerimaan
              </h3>
              <button onClick={() => setShowPrintModal(false)} style={{ color: "#9ca3af", background: "white", padding: "0.5rem", borderRadius: "9999px", border: "none", cursor: "pointer" }} className="hover:bg-gray-100 hover:text-gray-700 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem", overflowY: "auto" }}>
              {user?.role === "superadmin" && (
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem" }}>Pilih UPT</label>
                  <Select
                    options={upts.map(u => ({ value: u.kd_upt, label: u.nm_upt }))}
                    value={printUpt ? { value: printUpt, label: upts.find(u => u.kd_upt === printUpt)?.nm_upt } : null}
                    onChange={(sel: any) => setPrintUpt(sel?.value || "")}
                    placeholder="Semua UPT (Kosongkan untuk cetak semua)"
                    isClearable
                    menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                    styles={{ 
                      control: base => ({ ...base, borderRadius: '0.5rem', borderColor: '#e2e8f0', minHeight: '42px', boxShadow: 'none' }),
                      menuPortal: base => ({ ...base, zIndex: 99999 })
                    }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.75rem" }}>Mode Cetak</label>
                <div style={{ display: "flex", gap: "1rem" }}>
                  <label style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", cursor: "pointer", border: printMode === 'bulan' ? "1px solid #bfdbfe" : "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "0.75rem", backgroundColor: printMode === 'bulan' ? "#eff6ff" : "white", color: printMode === 'bulan' ? "#1d4ed8" : "#4b5563", fontWeight: printMode === 'bulan' ? 500 : 400, transition: "all 0.2s" }} className="hover:bg-gray-50">
                    <input type="radio" name="printMode" value="bulan" checked={printMode === "bulan"} onChange={() => setPrintMode("bulan")} style={{ position: "absolute", width: "1px", height: "1px", padding: 0, margin: "-1px", overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", borderWidth: 0 }} />
                    <FileText size={18} /> Per Bulan
                  </label>
                  <label style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", cursor: "pointer", border: printMode === 'tanggal' ? "1px solid #bfdbfe" : "1px solid #e5e7eb", borderRadius: "0.75rem", padding: "0.75rem", backgroundColor: printMode === 'tanggal' ? "#eff6ff" : "white", color: printMode === 'tanggal' ? "#1d4ed8" : "#4b5563", fontWeight: printMode === 'tanggal' ? 500 : 400, transition: "all 0.2s" }} className="hover:bg-gray-50">
                    <input type="radio" name="printMode" value="tanggal" checked={printMode === "tanggal"} onChange={() => setPrintMode("tanggal")} style={{ position: "absolute", width: "1px", height: "1px", padding: 0, margin: "-1px", overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", borderWidth: 0 }} />
                    <FileText size={18} /> Per Tanggal
                  </label>
                </div>
              </div>

              <div style={{ backgroundColor: "#f8fafc", padding: "1rem", borderRadius: "0.75rem", border: "1px solid #f1f5f9" }}>
                {printMode === "bulan" ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "1rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#334155", marginBottom: "0.375rem" }}>Bulan</label>
                      <select style={{ width: "100%", borderRadius: "0.5rem", border: "1px solid #e2e8f0", padding: "0.625rem", fontSize: "0.875rem", backgroundColor: "white", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", outline: "none" }} value={printMonth} onChange={e => setPrintMonth(e.target.value)}>
                        {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map((m, i) => (
                          <option key={i+1} value={i+1}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#334155", marginBottom: "0.375rem" }}>Tahun</label>
                      <input type="number" style={{ width: "100%", borderRadius: "0.5rem", border: "1px solid #e2e8f0", padding: "0.625rem", fontSize: "0.875rem", backgroundColor: "white", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", outline: "none" }} value={printYear} onChange={e => setPrintYear(e.target.value)} />
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "1rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#334155", marginBottom: "0.375rem" }}>Dari Tanggal</label>
                      <input type="date" style={{ width: "100%", borderRadius: "0.5rem", border: "1px solid #e2e8f0", padding: "0.625rem", fontSize: "0.875rem", backgroundColor: "white", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", outline: "none" }} value={printStartDate} onChange={e => setPrintStartDate(e.target.value)} />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#334155", marginBottom: "0.375rem" }}>Sampai Tanggal</label>
                      <input type="date" style={{ width: "100%", borderRadius: "0.5rem", border: "1px solid #e2e8f0", padding: "0.625rem", fontSize: "0.875rem", backgroundColor: "white", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", outline: "none" }} value={printEndDate} onChange={e => setPrintEndDate(e.target.value)} />
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid #f3f4f6", backgroundColor: "#f9fafb", display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "auto" }}>
              <button onClick={() => setShowPrintModal(false)} style={{ padding: "0.625rem 1.25rem", fontSize: "0.875rem", fontWeight: 500, color: "#374151", backgroundColor: "white", border: "1px solid #d1d5db", borderRadius: "0.5rem", cursor: "pointer" }} className="hover:bg-gray-50 transition-colors shadow-sm">
                Batal
              </button>
              <button onClick={handleOpenPrint} style={{ padding: "0.625rem 1.25rem", fontSize: "0.875rem", fontWeight: 500, color: "white", backgroundColor: "#2563eb", border: "1px solid transparent", borderRadius: "0.5rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }} className="hover:bg-blue-700 transition-colors shadow-sm">
                <Printer size={18} /> Cetak Laporan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Fungsional Modal */}
      {showPrintFungsionalModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div style={{ backgroundColor: "white", borderRadius: "1rem", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", width: "100%", maxWidth: "32rem", display: "flex", flexDirection: "column", maxHeight: "90vh", overflow: "hidden" }} className="animate-in zoom-in-95 duration-200">
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #f3f4f6", backgroundColor: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h3 style={{ display: "flex", alignItems: "center", gap: "0.75rem", color: "#1e293b", fontSize: "1.125rem", fontWeight: "bold", margin: 0 }}>
                <div style={{ backgroundColor: "#dbeafe", color: "#2563eb", padding: "0.5rem", borderRadius: "0.75rem" }}>
                  <FileText size={20} />
                </div>
                Cetak Laporan Fungsional
              </h3>
              <button onClick={() => setShowPrintFungsionalModal(false)} style={{ color: "#9ca3af", background: "white", padding: "0.5rem", borderRadius: "9999px", border: "none", cursor: "pointer" }} className="hover:bg-gray-100 hover:text-gray-700 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem", overflowY: "auto" }}>
              {user?.role === "superadmin" && (
                <div>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "0.5rem" }}>Pilih UPT</label>
                  <Select
                    options={upts.map(u => ({ value: u.kd_upt, label: u.nm_upt }))}
                    value={printUpt ? { value: printUpt, label: upts.find(u => u.kd_upt === printUpt)?.nm_upt } : null}
                    onChange={(sel: any) => setPrintUpt(sel?.value || "")}
                    placeholder="Semua UPT (Kosongkan untuk cetak semua)"
                    isClearable
                    menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                    styles={{ 
                      control: base => ({ ...base, borderRadius: '0.5rem', borderColor: '#e2e8f0', minHeight: '42px', boxShadow: 'none' }),
                      menuPortal: base => ({ ...base, zIndex: 99999 })
                    }}
                  />
                </div>
              )}

              <div style={{ backgroundColor: "#f8fafc", padding: "1rem", borderRadius: "0.75rem", border: "1px solid #f1f5f9" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#334155", marginBottom: "0.375rem" }}>Bulan Akhir</label>
                    <select style={{ width: "100%", borderRadius: "0.5rem", border: "1px solid #e2e8f0", padding: "0.625rem", fontSize: "0.875rem", backgroundColor: "white", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", outline: "none" }} value={printMonth} onChange={e => setPrintMonth(e.target.value)}>
                      {["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"].map((m, i) => (
                        <option key={i+1} value={i+1}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#334155", marginBottom: "0.375rem" }}>Tahun</label>
                    <input type="number" style={{ width: "100%", borderRadius: "0.5rem", border: "1px solid #e2e8f0", padding: "0.625rem", fontSize: "0.875rem", backgroundColor: "white", boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)", outline: "none" }} value={printYear} onChange={e => setPrintYear(e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
            
            <div style={{ padding: "1rem 1.5rem", borderTop: "1px solid #f3f4f6", backgroundColor: "#f9fafb", display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "auto" }}>
              <button onClick={() => setShowPrintFungsionalModal(false)} style={{ padding: "0.625rem 1.25rem", fontSize: "0.875rem", fontWeight: 500, color: "#374151", backgroundColor: "white", border: "1px solid #d1d5db", borderRadius: "0.5rem", cursor: "pointer" }} className="hover:bg-gray-50 transition-colors shadow-sm">
                Batal
              </button>
              <button onClick={handleOpenPrintFungsional} style={{ padding: "0.625rem 1.25rem", fontSize: "0.875rem", fontWeight: 500, color: "white", backgroundColor: "#2563eb", border: "1px solid transparent", borderRadius: "0.5rem", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.5rem" }} className="hover:bg-blue-700 transition-colors shadow-sm">
                <Printer size={18} /> Buka Laporan
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>💵 Penatausahaan Penerimaan</h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>Catat dan kelola penerimaan pendapatan BLUD</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={() => setShowPrintModal(true)} className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: 8, background: "white" }}>
            <Printer size={16} /> Cetak Register
          </button>
          <button onClick={() => setShowPrintFungsionalModal(true)} className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: 8, background: "white", borderColor: "#2563eb", color: "#2563eb" }}>
            <FileText size={16} /> Cetak Fungsional
          </button>
          {canCreate && (
            <Link href="/dashboard/penatausahaan/penerimaan/tambah">
              <button className="btn btn-primary">
                <Plus size={16} /> Tambah Penerimaan
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* Cards Total Penerimaan */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
        {/* Card Terverifikasi */}
        <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "white" }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 500, opacity: 0.9 }}>Total Penerimaan (Terverifikasi)</p>
            <h2 style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{formatRupiah(totalNilai)}</h2>
          </div>
          <div style={{ background: "rgba(255,255,255,0.2)", padding: 12, borderRadius: 12 }}>
            <CheckCircle size={32} />
          </div>
        </div>

        {/* Card Belum Diverifikasi */}
        <div className="card" style={{ padding: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", color: "white" }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 500, opacity: 0.9 }}>Penerimaan Belum Diverifikasi</p>
            <h2 style={{ fontSize: 28, fontWeight: 700, marginTop: 4 }}>{formatRupiah(totalUnverified)}</h2>
          </div>
          <div style={{ background: "rgba(255,255,255,0.2)", padding: 12, borderRadius: 12 }}>
            <ShieldCheck size={32} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ display: "flex", gap: 16, flexWrap: "wrap", borderBottom: "none", paddingBottom: 0 }}>
          {(user?.role === "superadmin") && (
            <div style={{ minWidth: 300, flex: 1, maxWidth: 400 }}>
              <Select
                options={upts.map(u => ({ value: u.kd_upt, label: u.nm_upt }))}
                value={uptFilter ? { value: uptFilter, label: upts.find(u => u.kd_upt === uptFilter)?.nm_upt } : null}
                onChange={(selected: any) => setUptFilter(selected?.value || "")}
                placeholder="-- Semua UPT --"
                isClearable
                menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                styles={{ 
                  control: (base) => ({ ...base, borderColor: '#e2e8f0', borderRadius: '0.375rem', minHeight: '42px' }),
                  menuPortal: base => ({ ...base, zIndex: 9999 })
                }}
              />
            </div>
          )}
          <input
            type="text"
            className="form-input"
            style={{ flex: 1, minWidth: 250, minHeight: '42px' }}
            placeholder="Cari No. Bukti, Penyetor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="tbl-wrap" style={{ marginTop: 20 }}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 40, textAlign: "center" }}>No</th>
                <th>Tgl Bukti</th>
                <th>No. Bukti</th>
                <th>Penyetor</th>
                <th>Uraian / Rekening</th>
                <th style={{ textAlign: "right" }}>Nilai (Rp)</th>
                <th style={{ textAlign: "center" }}>Status</th>
                <th style={{ textAlign: "center" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center p-6 text-gray-500"><div className="loading-spinner" style={{ margin: "0 auto" }} /></td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={8} className="text-center p-6 text-gray-500">
                  <div className="empty-state">
                    <div className="empty-state-icon">💵</div>
                    <p style={{ fontWeight: 600 }}>Belum ada data penerimaan</p>
                  </div>
                </td></tr>
              ) : (
                list.map((item, idx) => (
                  <tr key={item.idTerima}>
                    <td style={{ textAlign: "center" }}>{(page - 1) * limit + idx + 1}</td>
                    <td>{item.tglBukti ? new Date(item.tglBukti).toLocaleDateString("id-ID") : "-"}</td>
                    <td style={{ fontWeight: 600, color: "#2563EB" }}>{item.noBukti || "-"}</td>
                    <td>{item.nmPenyetor || "-"}</td>
                    <td>
                      <div style={{ fontWeight: 500, color: "#0F172A" }}>{item.keterangan || "-"}</div>
                      <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>{item.kdRek6} - {item.nmRek6}</div>
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>{formatRupiah(item.nilai || 0)}</td>
                    <td style={{ textAlign: "center" }}>
                      {item.verif === 1 ? (
                        <span className="badge badge-diverifikasi">
                          <CheckCircle size={12} /> Terverifikasi
                        </span>
                      ) : (
                        <span className="badge badge-draft">
                          <FileText size={12} /> Draft
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                        {canCreate && item.verif !== 1 && (
                          <>
                            <Link href={`/dashboard/penatausahaan/penerimaan/edit/${item.idTerima}`}>
                              <button className="btn btn-outline btn-sm" title="Edit">
                                <Pencil size={12} />
                              </button>
                            </Link>
                            <button onClick={() => handleDelete(item.idTerima)} className="btn btn-danger btn-sm" title="Hapus">
                              <Trash size={12} />
                            </button>
                          </>
                        )}
                        {canVerify && (
                          item.verif === 1 ? (
                            <button onClick={() => handleVerifikasi(item.idTerima, "batal_verifikasi")} className="btn btn-danger btn-sm" title="Batalkan Verifikasi">
                              <XCircle size={12} />
                            </button>
                          ) : (
                            <button onClick={() => handleVerifikasi(item.idTerima, "verifikasi")} className="btn btn-warning btn-sm" title="Verifikasi">
                              <ShieldCheck size={12} /> Verifikasi
                            </button>
                          )
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {!loading && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24, padding: "16px", borderTop: "1px solid #e2e8f0" }}>
            <span style={{ fontSize: 14, color: "#64748B" }}>
              Menampilkan {list.length} data pada halaman {page} dari {Math.max(1, totalPages)}
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn btn-outline btn-sm"
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                style={{ minWidth: 100 }}
              >
                Sebelumnya
              </button>
              <button
                className="btn btn-outline btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                style={{ minWidth: 100 }}
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
