"use client";

import { useState, useEffect } from "react";
import { Plus, Edit3, Trash2, Search, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Select from "react-select";
import Swal from "sweetalert2";

interface PUK {
  id: string;
  noPuk: string;
  kdUpt: string; nmUpt: string;
  kdProgram?: string | null; nmProgram?: string | null;
  kdKegiatan?: string | null; nmKegiatan?: string | null;
  kdUkm: string; nmUkm: string;
  kdPeruntukan: string; nmPeruntukan: string;
  kdKomponen: string; nmKomponen: string;
  kdRincian: string; nmRincian: string;
  kdSubKegiatan: string; nmSubKegiatan: string;
  kdSpm: string; nmSpm: string;
  tujuan: string; sasaran: string; targetSasaran: string; targetObjek: string; penanggungjawab: string; lokasi: string; sumdan: string;
  jan: number; feb: number; mar: number; apr: number; mei: number; jun: number; jul: number; agus: number; sep: number; okt: number; nov: number; des: number;
  nilai: number;
}

export default function PukPendapatanPage() {
  const router = useRouter();
  const [list, setList] = useState<PUK[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [summaryBySumdan, setSummaryBySumdan] = useState<any[]>([]);
  const [upts, setUpts] = useState<any[]>([]);
  const [filterUpt, setFilterUpt] = useState("");

  const [user, setUser] = useState<any>(null);
  const [tahun, setTahun] = useState<string>("");

  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printTgl, setPrintTgl] = useState("");
  const [printUpt, setPrintUpt] = useState("");

  useEffect(() => {
    fetch("/api/me").then(r => r.json()).then(d => {
      if (d.user) {
        setUser(d.user);
        setTahun(d.user.tahun || new Date().getFullYear().toString());
        if (d.user.role === "superadmin") {
          fetch("/api/master/upt?limit=100").then(r => r.json()).then(res => setUpts(res.data || []));
        } else {
          setPrintUpt(d.user.kd_upt);
        }
      }
    }).catch(e => console.error("Gagal load user", e));
  }, []);

  const loadData = () => {
    setLoading(true);
    const query = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      q
    });
    if (filterUpt) query.append("kd_upt", filterUpt);

    fetch(`/api/perencanaan/puk-pendapatan?${query.toString()}`)
      .then(r => r.json())
      .then(d => {
        setList(d.data || []);
        setTotal(d.pagination?.total || 0);
        setSummaryBySumdan(d.summaryBySumdan || []);
        setGrandTotal(d.grandTotal || 0);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user) loadData();
  }, [page, limit, q, filterUpt, user]);

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      title: "Hapus RUK Pendapatan?",
      text: "Data RUK Pendapatan akan dihapus secara permanen.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#64748B",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal"
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/perencanaan/puk-pendapatan/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      Swal.fire({
        icon: "success",
        title: "Terhapus",
        text: "Data RUK Pendapatan berhasil dihapus.",
        timer: 1500,
        showConfirmButton: false
      });
      loadData();
    } catch (e: any) {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: e.message || "Gagal menghapus"
      });
    }
  };

  const handleEdit = (item: PUK) => {
    router.push(`/dashboard/perencanaan/puk-pendapatan/${item.id}/rincian`);
  };

  const handlePrint = () => {
    if (user?.role === 'superadmin' && !printUpt) {
      Swal.fire({
        icon: "warning",
        title: "Perhatian",
        text: "Silakan pilih UPT terlebih dahulu!",
        confirmButtonColor: "#3B82F6"
      });
      return;
    }
    if (!printTgl) {
      Swal.fire({
        icon: "warning",
        title: "Perhatian",
        text: "Silakan isi Tanggal Cetak!",
        confirmButtonColor: "#3B82F6"
      });
      return;
    }
    const url = new URL("/dashboard/perencanaan/puk-pendapatan/cetak", window.location.origin);
    url.searchParams.set("tahun", tahun);
    url.searchParams.set("kd_upt", printUpt);
    url.searchParams.set("tgl", printTgl);
    window.open(url.toString(), "_blank");
    setShowPrintModal(false);
  };

  const formLabelStyle = { fontWeight: 600, color: "#334155", fontSize: 13, marginBottom: 6, display: "block" };
  const formInputStyle = { background: "#F8FAFC", width: "100%", fontSize: 13, borderRadius: 6, border: "1px solid #E2E8F0", padding: "8px 12px" };
  const sectionTitleStyle = { fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid #E2E8F0" };

  return (
    <div className="animate-fadein relative">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>📑 Rencana Usulan Kegiatan Pendapatan</h1>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            className="btn btn-outline"
            onClick={() => setShowPrintModal(true)}
          >
            <FileText size={16} /> Cetak RUK Pendapatan
          </button>
          <Link href="/dashboard/perencanaan/puk-pendapatan/create">
            <button className="btn btn-primary">
              <Plus size={16} /> Tambah RUK Pendapatan
            </button>
          </Link>
        </div>
      </div>

      {/* Summary Card By Sumdan removed */}

      <div className="card">
        <div className="card-header">
          <span className="card-title">Daftar RUK Pendapatan</span>
        </div>

        {loading ? (
          <div className="empty-state" style={{ padding: 48 }}><div className="loading-spinner" /></div>
        ) : (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569", zIndex: 10 }}>
                  Show
                  <div style={{ width: 80 }}>
                    <Select menuPosition="fixed" options={[
                      { value: 10, label: "10" },
                      { value: 25, label: "25" },
                      { value: 50, label: "50" },
                      { value: 100, label: "100" },
                    ]}
                      value={{ value: limit, label: limit.toString() }}
                      onChange={(e: any) => { setLimit(e.value); setPage(1); }}
                      styles={{
                        control: (base) => ({ ...base, fontSize: 13, minHeight: 32 }),
                        dropdownIndicator: (base) => ({ ...base, padding: 4 })
                      }}
                    />
                  </div>
                  entries
                </div>
                {user?.role === "superadmin" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569", zIndex: 10 }}>
                    Filter UPT:
                    <div style={{ width: 200 }}>
                      <Select menuPosition="fixed" options={[
                        { value: "", label: "Semua UPT" },
                        ...upts.map(upt => ({ value: upt.kd_upt, label: upt.nm_upt }))
                      ]}
                        value={{
                          value: filterUpt,
                          label: filterUpt ? upts.find(u => u.kd_upt === filterUpt)?.nm_upt || filterUpt : "Semua UPT"
                        }}
                        onChange={(e: any) => { setFilterUpt(e.value); setPage(1); }}
                        styles={{
                          control: (base) => ({ ...base, fontSize: 13, minHeight: 32 })
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569" }}>
                Search:
                <input
                  type="text"
                  style={{ ...formInputStyle, width: 200, padding: "4px 12px" }}
                  value={q}
                  onChange={(e) => { setQ(e.target.value); setPage(1); }}
                />
              </div>
            </div>

            {list.length === 0 ? (
              <div className="empty-state" style={{ padding: 48, borderTop: "1px solid #E2E8F0" }}>
                <div className="empty-state-icon">📄</div>
                <p style={{ fontWeight: 600 }}>Belum ada Data RUK Pendapatan</p>
              </div>
            ) : (
              <div className="tbl-wrap" style={{ borderRadius: 0 }}>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th style={{ width: 40, textAlign: "center" }}>No.</th>
                      <th>Nama UPT</th>
                      <th>Program</th>
                      <th>Kegiatan</th>
                      <th>Sub Kegiatan</th>
                      <th style={{ textAlign: "right", width: 140 }}>Nilai (Rp.)</th>
                      <th style={{ width: 90, textAlign: "center" }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((item, i) => (
                      <tr key={item.id}>
                        <td style={{ textAlign: "center", fontSize: 12, color: "#64748B" }}>{(page - 1) * limit + i + 1}</td>
                        <td style={{ fontSize: 13, color: "#334155", fontWeight: 600 }}>{item.nmUpt || "-"}</td>
                        <td style={{ fontSize: 13, color: "#334155" }}>{item.nmProgram || "-"}</td>
                        <td style={{ fontSize: 13, color: "#334155" }}>{item.nmKegiatan || "-"}</td>
                        <td style={{ fontSize: 13, color: "#334155" }}>{item.nmSubKegiatan}</td>
                        <td style={{ textAlign: "right", fontSize: 13, fontWeight: 600, color: "#0F172A" }}>
                          {new Intl.NumberFormat('id-ID').format(item.nilai || 0)}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 5, justifyContent: "center" }}>
                            <button className="btn btn-outline btn-sm" onClick={() => handleEdit(item)} title="Edit">
                              <Edit3 size={12} />
                            </button>
                            <button className="btn btn-sm" style={{ background: "#FEE2E2", color: "#DC2626", borderColor: "#FECACA" }} onClick={() => handleDelete(item.id)} title="Hapus">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={5} style={{ textAlign: "right", fontWeight: 700, fontSize: 14, color: "#0F172A" }}>Jumlah Total (Rp.)</td>
                      <td style={{ textAlign: "right", fontWeight: 700, fontSize: 14, color: "#0F172A" }}>
                        {new Intl.NumberFormat('id-ID').format(grandTotal)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {!loading && list.length > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderTop: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 13, color: "#64748B" }}>
                  Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} entries
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={{ padding: "4px 12px", border: "1px solid #E2E8F0", borderRadius: 4, background: page === 1 ? "#F8FAFC" : "#FFF", color: page === 1 ? "#CBD5E1" : "#475569", cursor: page === 1 ? "not-allowed" : "pointer" }}
                  >Previous</button>
                  <button style={{ padding: "4px 12px", border: "1px solid #3B82F6", borderRadius: 4, background: "#3B82F6", color: "#FFF", fontWeight: 600 }}>{page}</button>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={page * limit >= total}
                    style={{ padding: "4px 12px", border: "1px solid #E2E8F0", borderRadius: 4, background: page * limit >= total ? "#F8FAFC" : "#FFF", color: page * limit >= total ? "#CBD5E1" : "#475569", cursor: page * limit >= total ? "not-allowed" : "pointer" }}
                  >Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {showPrintModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#FFF", borderRadius: 8, padding: 24, width: 400, maxWidth: "90%" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: 18, color: "#0F172A" }}>Cetak RUK Pendapatan</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
              {user?.role === "superadmin" && (
                <div>
                  <label style={formLabelStyle}>Pilih UPT *</label>
                  <Select
                    menuPosition="fixed"
                    options={upts.map(upt => ({ value: upt.kd_upt, label: upt.nm_upt }))}
                    value={printUpt ? { value: printUpt, label: upts.find(u => u.kd_upt === printUpt)?.nm_upt || printUpt } : null}
                    onChange={(e: any) => setPrintUpt(e.value)}
                    placeholder="Pilih UPT..."
                    styles={{
                      control: (base) => ({ ...base, fontSize: 13, minHeight: 38 })
                    }}
                  />
                </div>
              )}
              <div>
                <label style={formLabelStyle}>Tanggal Cetak *</label>
                <input
                  type="date"
                  style={formInputStyle}
                  value={printTgl}
                  onChange={(e) => setPrintTgl(e.target.value)}
                />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn btn-outline" onClick={() => setShowPrintModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handlePrint}>Cetak</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
