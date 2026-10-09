"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Eye, Printer, ShieldCheck, FileCheck, Search, Filter, AlertCircle, RefreshCw } from "lucide-react";
import Select from "react-select";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

const BULAN_NAMA = [
  "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

function formatRupiah(val: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val || 0);
}

export default function Sp3bPage() {
  const router = useRouter();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const [user, setUser] = useState<any>(null);
  const [upts, setUpts] = useState<any[]>([]);
  const [filterUpt, setFilterUpt] = useState("");
  const [filterBulan, setFilterBulan] = useState<number | "">("");

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [eligibleLpjList, setEligibleLpjList] = useState<any[]>([]);
  const [loadingEligible, setLoadingEligible] = useState(false);

  const now = new Date();
  const [tahun, setTahun] = useState(now.getFullYear());
  const [modalForm, setModalForm] = useState({
    kdUnit: "",
    bulan: now.getMonth() + 1,
    no_lpj: "",
    no_sp3b: "",
    tgl_sp3b: new Date().toISOString().split("T")[0],
    ket: "",
  });

  const selectedLpjData = eligibleLpjList.find((l) => l.no_lpj === modalForm.no_lpj && l.kd_upt === modalForm.kdUnit);

  useEffect(() => {
    const t = localStorage.getItem("tahunName");
    if (t) setTahun(parseInt(t));

    // Load UPTs
    fetch("/api/master/upt?limit=1000")
      .then((r) => r.json())
      .then((d) => {
        if (d.data && d.data.length > 0) setUpts(d.data);
      })
      .catch(() => {});

    // Load User
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          setUser(d.user);
          // Hanya Dinkes/Superadmin
          const isDinkes = d.user.role === "superadmin" || d.user.level === 1 || d.user.role === "keuangan" || d.user.role === "kpa";
          if (!isDinkes) {
            Swal.fire({
              icon: "error",
              title: "Akses Ditolak",
              text: "Menu SP3B hanya dapat diakses oleh Administrator dan Dinas Kesehatan.",
            }).then(() => router.push("/dashboard"));
          }
        }
      })
      .catch((e) => console.error("Gagal load user", e));
  }, []);

  const loadData = () => {
    setLoading(true);
    const query = new URLSearchParams({
      q,
      page: page.toString(),
      limit: limit.toString(),
      tahun: tahun.toString(),
    });
    if (filterUpt) query.append("kd_upt", filterUpt);
    if (filterBulan) query.append("bulan", filterBulan.toString());

    fetch(`/api/verifikasi/sp3b?${query.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setList(d.data || []);
          if (d.pagination) {
            setTotal(d.pagination.total || 0);
            setTotalPages(d.pagination.totalPages || 1);
          }
        } else {
          setList([]);
        }
      })
      .catch((e) => console.error("Load SP3B data error:", e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [q, filterUpt, filterBulan, page, limit, tahun]);

  // Load LPJ yang belum dibuatkan SP3B ketika UPT / Bulan di modal berubah
  const loadEligibleLpj = (targetUpt: string, targetBulan: number) => {
    if (!targetUpt) {
      setEligibleLpjList([]);
      return;
    }
    setLoadingEligible(true);
    fetch(`/api/verifikasi/sp3b?mode=eligible_lpj&kd_upt=${targetUpt}&bulan=${targetBulan}&tahun=${tahun}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setEligibleLpjList(res.data || []);
          setModalForm((prev) => ({
            ...prev,
            no_sp3b: res.next_no_sp3b || prev.no_sp3b,
            no_lpj: res.data && res.data.length > 0 ? res.data[0].no_lpj : "",
            ket: `Surat Permintaan Pengesahan Pendapatan dan Belanja (SP3B) Bulan ${BULAN_NAMA[targetBulan]} ${tahun}`,
          }));
        }
      })
      .catch((err) => console.error("Load eligible LPJ error:", err))
      .finally(() => setLoadingEligible(false));
  };

  const handleOpenModal = () => {
    const defaultUpt = upts[0]?.kd_upt || "";
    const defaultBulan = now.getMonth() + 1;

    setModalForm({
      kdUnit: defaultUpt,
      bulan: defaultBulan,
      no_lpj: "",
      no_sp3b: "",
      tgl_sp3b: new Date().toISOString().split("T")[0],
      ket: `Surat Permintaan Pengesahan Pendapatan dan Belanja (SP3B) Bulan ${BULAN_NAMA[defaultBulan]} ${tahun}`,
    });
    setShowModal(true);
    if (defaultUpt) {
      loadEligibleLpj(defaultUpt, defaultBulan);
    }
  };

  const handleUptModalChange = (selectedKdUpt: string) => {
    setModalForm((prev) => ({
      ...prev,
      kdUnit: selectedKdUpt,
    }));
    loadEligibleLpj(selectedKdUpt, modalForm.bulan);
  };

  const handleBulanModalChange = (selectedBulan: number) => {
    setModalForm((prev) => ({ ...prev, bulan: selectedBulan }));
    if (modalForm.kdUnit) {
      loadEligibleLpj(modalForm.kdUnit, selectedBulan);
    }
  };

  const handleCreateSp3b = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalForm.kdUnit || !modalForm.no_lpj || !modalForm.no_sp3b) {
      Swal.fire("Peringatan", "Harap lengkapi semua kolom yang wajib diisi", "warning");
      return;
    }

    const confirm = await Swal.fire({
      title: "Konfirmasi Penerbitan SP3B",
      html: `
        <div style="text-align: left; font-size: 13px;">
          <p>Apakah Anda yakin akan menerbitkan <b>SP3B</b> untuk:</p>
          <ul>
            <li><b>No. SP3B:</b> ${modalForm.no_sp3b}</li>
            <li><b>No. LPJ:</b> ${modalForm.no_lpj}</li>
            <li><b>Periode:</b> Bulan ${BULAN_NAMA[modalForm.bulan]} ${tahun}</li>
          </ul>
          <p style="color: #2563EB; font-weight: 600;">⚠️ Dokumen LPJ UPT terkait akan otomatis terkunci dari perubahan.</p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#2563EB",
      cancelButtonColor: "#64748B",
      confirmButtonText: "Ya, Terbitkan SP3B",
      cancelButtonText: "Batal",
    });

    if (!confirm.isConfirmed) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/verifikasi/sp3b", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          no_sp3b: modalForm.no_sp3b,
          tgl_sp3b: modalForm.tgl_sp3b,
          kd_upt: modalForm.kdUnit,
          no_lpj: modalForm.no_lpj,
          ket: modalForm.ket,
        }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        Swal.fire("Berhasil", result.message || "Dokumen SP3B berhasil diterbitkan!", "success");
        setShowModal(false);
        loadData();
      } else {
        Swal.fire("Gagal", result.error || "Gagal menerbitkan SP3B", "error");
      }
    } catch (err: any) {
      Swal.fire("Error", err.message || "Terjadi kesalahan sistem", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSp3b = async (item: any) => {
    const confirm = await Swal.fire({
      title: "Batalkan Dokumen SP3B?",
      html: `
        <div style="text-align: left; font-size: 13px;">
          <p>Anda akan membatalkan <b>SP3B Nomor: ${item.no_sp3b}</b>.</p>
          <p style="color: #DC2626; font-weight: 600;">Status kunci LPJ terkait (${item.no_lpj}) pada UPT akan dibuka kembali.</p>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#DC2626",
      cancelButtonColor: "#64748B",
      confirmButtonText: "Ya, Batalkan SP3B",
      cancelButtonText: "Batal",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await fetch(`/api/verifikasi/sp3b?no_sp3b=${encodeURIComponent(item.no_sp3b)}&kd_upt=${item.kd_upt}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (res.ok && result.success) {
        Swal.fire("Berhasil", result.message || "Dokumen SP3B berhasil dibatalkan", "success");
        loadData();
      } else {
        Swal.fire("Gagal", result.error || "Gagal membatalkan SP3B", "error");
      }
    } catch (err: any) {
      Swal.fire("Error", err.message || "Terjadi kesalahan sistem", "error");
    }
  };

  const handleDetail = (kdUnit: string, no_sp3b: string) => {
    router.push(`/dashboard/verifikasi/sp3b/${kdUnit}/${encodeURIComponent(no_sp3b)}`);
  };

  const handleCetak = (item: any) => {
    window.open(`/dashboard/verifikasi/sp3b/cetak?no_sp3b=${encodeURIComponent(item.no_sp3b)}&kd_upt=${item.kd_upt}`, "_blank");
  };

  const formInputStyle = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: 6,
    border: "1px solid #CBD5E1",
    fontSize: 13,
    color: "#0F172A",
    backgroundColor: "#FFFFFF",
    outline: "none",
  };

  return (
    <div className="animate-fadein">
      {/* Header Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", display: "flex", alignItems: "center", gap: 8 }}>
            <FileCheck size={26} color="#2563EB" />
            Surat Permintaan Pengesahan Pendapatan & Belanja (SP3B)
          </h1>
          <div style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>
            Verifikasi dan penerbitan SP3B resmi tingkat Dinas Kesehatan berdasarkan dokumen Pengesahan LPJ UPT
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            className="btn btn-primary"
            onClick={handleOpenModal}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 18px", fontWeight: 700 }}
          >
            <Plus size={16} /> Buat SP3B Baru
          </button>
        </div>
      </div>

      {/* Filter Card */}
      <div className="card" style={{ marginBottom: 24, padding: "16px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, alignItems: "flex-end" }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6, textTransform: "uppercase" }}>
              Filter Unit Kerja (UPT)
            </label>
            <Select
              placeholder="Semua UPT Puskesmas..."
              isClearable
              options={upts.map((u: any) => ({ value: u.kd_upt, label: `[${u.kd_upt}] ${u.nm_upt}` }))}
              value={filterUpt ? { value: filterUpt, label: upts.find((u) => u.kd_upt === filterUpt)?.nm_upt || filterUpt } : null}
              onChange={(v: any) => {
                setFilterUpt(v?.value || "");
                setPage(1);
              }}
              styles={{
                control: (b) => ({ ...b, minHeight: 38, borderRadius: 6, borderColor: "#CBD5E1" }),
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6, textTransform: "uppercase" }}>
              Filter Bulan
            </label>
            <select
              className="form-select"
              style={formInputStyle}
              value={filterBulan}
              onChange={(e) => {
                setFilterBulan(e.target.value ? parseInt(e.target.value) : "");
                setPage(1);
              }}
            >
              <option value="">Semua Bulan</option>
              {BULAN_NAMA.slice(1).map((nm, idx) => (
                <option key={idx + 1} value={idx + 1}>
                  {nm}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 6, textTransform: "uppercase" }}>
              Pencarian
            </label>
            <div style={{ position: "relative" }}>
              <input
                type="text"
                placeholder="Cari No SP3B / No LPJ / Keterangan..."
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
                style={{ ...formInputStyle, paddingLeft: 34 }}
              />
              <Search size={16} color="#94A3B8" style={{ position: "absolute", left: 10, top: 11 }} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card">
        <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="card-title">Daftar Dokumen SP3B Diterbitkan ({total})</span>
          <button onClick={loadData} className="btn btn-outline" style={{ padding: "5px 10px", fontSize: 12, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="empty-state" style={{ padding: 48 }}><div className="loading-spinner" /></div>
        ) : list.length === 0 ? (
          <div className="empty-state" style={{ padding: 48, fontSize: 13, color: "#64748B" }}>
            Belum ada dokumen SP3B yang diterbitkan untuk filter ini.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ backgroundColor: "#F8FAFC" }}>
                <tr>
                  <th style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#1E293B", textTransform: "uppercase", textAlign: "center", width: 50 }}>No</th>
                  <th style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#1E293B", textTransform: "uppercase", textAlign: "left", width: 220 }}>Nomor Dokumen SP3B</th>
                  <th style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#1E293B", textTransform: "uppercase", textAlign: "left", width: 140 }}>Tanggal SP3B</th>
                  <th style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#1E293B", textTransform: "uppercase", textAlign: "left" }}>Unit Kerja & Ref LPJ</th>
                  <th style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#1E293B", textTransform: "uppercase", textAlign: "center", width: 110 }}>Bulan</th>
                  <th style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#1E293B", textTransform: "uppercase", textAlign: "right", width: 180 }}>Total Pendapatan</th>
                  <th style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#1E293B", textTransform: "uppercase", textAlign: "right", width: 180 }}>Total Belanja</th>
                  <th style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#1E293B", textTransform: "uppercase", textAlign: "center", width: 120 }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {list.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #E2E8F0" }} className="hover:bg-slate-50/50">
                    <td style={{ padding: "14px 16px", fontSize: 12, color: "#64748B", textAlign: "center", verticalAlign: "top" }}>
                      {(page - 1) * limit + idx + 1}
                    </td>
                    <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", fontFamily: "monospace" }}>
                        {item.no_sp3b}
                      </div>
                      <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                        Petugas: {item.username || "Dinas Kesehatan"}
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 12, color: "#334155", verticalAlign: "top" }}>
                      {item.tgl_sp3b ? new Date(item.tgl_sp3b).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-"}
                    </td>
                    <td style={{ padding: "14px 16px", verticalAlign: "top" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{item.nm_upt}</div>
                      <div style={{ fontSize: 11, color: "#2563EB", fontFamily: "monospace", marginTop: 2 }}>
                        Ref LPJ: {item.no_lpj || "-"}
                      </div>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center", verticalAlign: "top" }}>
                      <span style={{ backgroundColor: "#F1F5F9", color: "#334155", padding: "3px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                        {BULAN_NAMA[item.bulan] || item.bulan}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 12.5, color: "#10B981", fontWeight: 700, textAlign: "right", verticalAlign: "top" }}>
                      {formatRupiah(Number(item.total_pendapatan) || 0)}
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 12.5, color: "#2563EB", fontWeight: 700, textAlign: "right", verticalAlign: "top" }}>
                      {formatRupiah(Number(item.total_belanja) || 0)}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center", verticalAlign: "top" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        <button
                          onClick={() => handleDetail(item.kd_upt, item.no_sp3b)}
                          title="Lihat Detail SP3B"
                          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 4, border: "1px solid #BFDBFE", backgroundColor: "#EFF6FF", color: "#3B82F6", cursor: "pointer" }}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleCetak(item)}
                          title="Cetak Dokumen SP3B"
                          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 4, border: "1px solid #CBD5E1", backgroundColor: "#F8FAFC", color: "#475569", cursor: "pointer" }}
                        >
                          <Printer size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteSp3b(item)}
                          title="Batalkan SP3B (Buka Kunci LPJ UPT)"
                          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 4, border: "1px solid #FECACA", backgroundColor: "#FEF2F2", color: "#EF4444", cursor: "pointer" }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && list.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px" }}>
            <div style={{ fontSize: 13, color: "#64748B" }}>
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} entries
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <button
                style={{ padding: "6px 12px", border: "1px solid #E2E8F0", borderRadius: 4, fontSize: 13, color: page === 1 ? "#94A3B8" : "#475569", backgroundColor: "#fff", cursor: page === 1 ? "not-allowed" : "pointer" }}
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
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
                    color: num === page ? "#fff" : "#475569",
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

      {/* Modal Form Penerbitan SP3B Baru */}
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", width: 620, borderRadius: 12, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #E2E8F0" }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0F172A", margin: 0 }}>Penerbitan Dokumen SP3B Baru</h2>
              <div style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>
                Pilih Dokumen LPJ yang telah disahkan UPT untuk diterbitkan SP3B resmi Dinas Kesehatan
              </div>
            </div>

            <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>
              <form id="sp3bForm" onSubmit={handleCreateSp3b} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: "#334155", textTransform: "uppercase" }}>
                    Unit Kerja (UPT) Target <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <Select
                    placeholder="Pilih UPT..."
                    menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                    options={upts.map((u: any) => ({ value: u.kd_upt, label: `[${u.kd_upt}] ${u.nm_upt}` }))}
                    value={modalForm.kdUnit ? { value: modalForm.kdUnit, label: upts.find((u) => u.kd_upt === modalForm.kdUnit)?.nm_upt || modalForm.kdUnit } : null}
                    onChange={(v: any) => handleUptModalChange(v?.value || "")}
                    styles={{
                      control: (b) => ({ ...b, minHeight: 38, borderRadius: 6, borderColor: "#CBD5E1" }),
                      menuPortal: (b) => ({ ...b, zIndex: 99999 }),
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: "#334155", textTransform: "uppercase" }}>
                      Bulan LPJ <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <select
                      className="form-select"
                      style={formInputStyle}
                      value={modalForm.bulan}
                      onChange={(e) => handleBulanModalChange(parseInt(e.target.value))}
                      required
                    >
                      {BULAN_NAMA.slice(1).map((nm, i) => (
                        <option key={i + 1} value={i + 1}>{nm}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: "#334155", textTransform: "uppercase" }}>
                      Tanggal Dokumen SP3B <span style={{ color: "#EF4444" }}>*</span>
                    </label>
                    <input
                      type="date"
                      style={formInputStyle}
                      value={modalForm.tgl_sp3b}
                      onChange={(e) => setModalForm({ ...modalForm, tgl_sp3b: e.target.value })}
                      required
                    />
                  </div>
                </div>

                {/* Pilih No. LPJ Referensi */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: "#334155", textTransform: "uppercase" }}>
                    Pilih Nomor LPJ (Pengesahan UPT) <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  {loadingEligible ? (
                    <div style={{ fontSize: 12, color: "#64748B", padding: "8px 0" }}>Memuat daftar LPJ yang tersedia...</div>
                  ) : eligibleLpjList.length === 0 ? (
                    <div style={{ padding: "12px 14px", borderRadius: 6, backgroundColor: "#FEF2F2", border: "1px solid #FECACA", fontSize: 12, color: "#991B1B", display: "flex", alignItems: "center", gap: 8 }}>
                      <AlertCircle size={16} />
                      Tidak ada LPJ terverifikasi pada periode/UPT ini yang belum dibuatkan SP3B.
                    </div>
                  ) : (
                    <select
                      className="form-select"
                      style={{ ...formInputStyle, fontWeight: 600, fontFamily: "monospace" }}
                      value={modalForm.no_lpj}
                      onChange={(e) => setModalForm({ ...modalForm, no_lpj: e.target.value })}
                      required
                    >
                      {eligibleLpjList.map((l) => (
                        <option key={l.no_lpj} value={l.no_lpj}>
                          {l.no_lpj} ({l.sumdan || "Semua Dana"}) - Tgl: {l.tgl_lpj ? new Date(l.tgl_lpj).toLocaleDateString("id-ID") : "-"}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Preview Nilai LPJ yang Dipilih */}
                {selectedLpjData && (
                  <div style={{ padding: "14px 16px", borderRadius: 8, backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", marginBottom: 8 }}>
                      Ringkasan Transaksi LPJ Terpilih
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 11, color: "#166534" }}>Total Pendapatan:</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#10B981" }}>
                          {formatRupiah(Number(selectedLpjData.total_pendapatan) || 0)}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "#1E40AF" }}>Total Belanja:</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#2563EB" }}>
                          {formatRupiah(Number(selectedLpjData.total_belanja) || 0)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: "#334155", textTransform: "uppercase" }}>
                    Nomor Dokumen SP3B <span style={{ color: "#EF4444" }}>*</span>
                  </label>
                  <input
                    type="text"
                    style={{ ...formInputStyle, fontFamily: "monospace", fontWeight: 700 }}
                    value={modalForm.no_sp3b}
                    onChange={(e) => setModalForm({ ...modalForm, no_sp3b: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, marginBottom: 6, color: "#334155", textTransform: "uppercase" }}>
                    Keterangan / Uraian
                  </label>
                  <textarea
                    rows={2}
                    style={{ ...formInputStyle, resize: "vertical" }}
                    value={modalForm.ket}
                    onChange={(e) => setModalForm({ ...modalForm, ket: e.target.value })}
                  />
                </div>
              </form>
            </div>

            <div style={{ padding: "16px 24px", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowModal(false)}
                disabled={submitting}
              >
                Batal
              </button>
              <button
                type="submit"
                form="sp3bForm"
                className="btn btn-primary"
                disabled={submitting || eligibleLpjList.length === 0}
                style={{ minWidth: 140 }}
              >
                {submitting ? "Memproses..." : "Terbitkan SP3B"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
