"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Eye, Printer, ShieldCheck, XCircle } from "lucide-react";
import Select from "react-select";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

const BULAN_NAMA = [
  "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

function formatRupiah(val: number) {
  return new Intl.NumberFormat("id-ID").format(val || 0);
}

export default function LpjPage() {
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
  const [submitting, setSubmitting] = useState(false);
  const [sumberDanaOptions, setSumberDanaOptions] = useState<string[]>(["Dana kapitasi JKN"]);

  const now = new Date();
  const [tahun, setTahun] = useState(now.getFullYear());
  const [form, setForm] = useState({
    kdUnit: "",
    nomor_lpj: "",
    tanggal_pengesahan: new Date().toISOString().split("T")[0],
    bulan: now.getMonth() + 1,
    sumdan: "Dana kapitasi JKN",
    keterangan: ""
  });

  const [modalPreviewLoading, setModalPreviewLoading] = useState(false);
  const [modalSummary, setModalSummary] = useState<{ totalPendapatan: number; totalBelanja: number; countPendapatan: number; countBelanja: number } | null>(null);
  const [modalExistingLpj, setModalExistingLpj] = useState<{ id: number; no_lpj: string; disahkan_oleh: string; tgl_disahkan: string } | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("tahunName");
    if (t) setTahun(parseInt(t));

    fetch("/api/master/upt?limit=1000").then(r => r.json()).then(d => {
      if (d.data && d.data.length > 0) {
        setUpts(d.data);
      } else {
        fetch("/api/upt?limit=1000").then(r2 => r2.json()).then(d2 => {
          if (d2.data) setUpts(d2.data);
        }).catch(() => {});
      }
    }).catch(() => {
      fetch("/api/upt?limit=1000").then(r2 => r2.json()).then(d2 => {
        if (d2.data) setUpts(d2.data);
      }).catch(() => {});
    });

    fetch("/api/me").then(r => r.json()).then(d => {
      if (d.user) {
        setUser(d.user);
        if (d.user.role !== "superadmin" && d.user.level !== 1) {
          const userUpt = d.user.kd_upt || d.user.unit || "";
          setFilterUpt(userUpt);
          setForm(prev => ({ ...prev, kdUnit: userUpt }));
        }
      }
    }).catch(e => console.error("Gagal load user", e));

    fetch("/api/master/sumber-dana").then(r => r.json()).then(res => {
      if (res.data && res.data.length > 0) {
        setSumberDanaOptions(res.data.map((d: any) => d.nm_dana || d.sumdan || d.nama));
      }
    }).catch(() => {});
  }, []);

  const loadData = () => {
    setLoading(true);
    const query = new URLSearchParams({
      q,
      page: page.toString(),
      limit: limit.toString(),
      tahun: tahun.toString()
    });
    if (filterUpt) query.append("kd_upt", filterUpt);

    fetch(`/api/pelaporan/lpj?${query.toString()}`)
      .then(r => r.json())
      .then(d => {
        setList(d.publishedLpjList || d.data || []);
        if (d.pagination) {
          setTotal(d.pagination.total || 0);
          setTotalPages(d.pagination.totalPages || 1);
        }
        if (d.sumberDanaList && d.sumberDanaList.length > 0) {
          setSumberDanaOptions(d.sumberDanaList);
        }
      })
      .catch(e => console.error("Load LPJ data error:", e))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [q, filterUpt, page, limit, tahun]);

  const getNextNoLpj = (targetUpt: string) => {
    if (!targetUpt) return `00001/UPT/SPTJ/${tahun}`;
    const uptList = list.filter(item => item.kd_upt === targetUpt && String(item.tahun) === String(tahun));
    const nextUrut = String(uptList.length + 1).padStart(5, "0");
    return `${nextUrut}/${targetUpt}/SPTJ/${tahun}`;
  };

  const loadModalSummary = (kd_upt: string, targetBulan: number, targetSumdan: string) => {
    if (!kd_upt) {
      setModalSummary(null);
      setModalExistingLpj(null);
      return;
    }
    setModalPreviewLoading(true);
    fetch(`/api/pelaporan/lpj?bulan=${targetBulan}&tahun=${tahun}&kd_upt=${kd_upt}&sumdan=${encodeURIComponent(targetSumdan)}`)
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          setModalSummary({
            totalPendapatan: res.totalPendapatan || 0,
            totalBelanja: res.totalBelanja || 0,
            countPendapatan: (res.rincianPendapatan || []).length,
            countBelanja: (res.rincianBelanja || []).length,
          });
          if (res.isDisahkan && res.lpj) {
            setModalExistingLpj({
              id: res.lpj.id,
              no_lpj: res.lpj.no_lpj,
              disahkan_oleh: res.lpj.disahkan_oleh,
              tgl_disahkan: res.lpj.tgl_disahkan
            });
            setForm(prev => ({ ...prev, nomor_lpj: res.lpj.no_lpj }));
          } else {
            setModalExistingLpj(null);
            setForm(prev => ({ ...prev, nomor_lpj: getNextNoLpj(kd_upt) }));
          }
          if (res.sumberDanaList && res.sumberDanaList.length > 0) {
            setSumberDanaOptions(res.sumberDanaList);
          }
        }
      })
      .catch(e => console.error("Modal summary load error:", e))
      .finally(() => setModalPreviewLoading(false));
  };

  const openModal = () => {
    const targetUpt = (user?.role === "superadmin" || user?.level === 1) ? (filterUpt || (upts[0]?.kd_upt || "")) : user?.kd_upt;
    const currentBulan = now.getMonth() + 1;
    const autoNo = getNextNoLpj(targetUpt || "");

    setForm({
      kdUnit: targetUpt || "",
      nomor_lpj: autoNo,
      tanggal_pengesahan: new Date().toISOString().split("T")[0],
      bulan: currentBulan,
      sumdan: "Dana kapitasi JKN",
      keterangan: `Pengesahan Laporan Pertanggungjawaban (SPTJ) Periode ${BULAN_NAMA[currentBulan]} ${tahun}`
    });
    setModalExistingLpj(null);
    setShowModal(true);

    if (targetUpt) {
      loadModalSummary(targetUpt, currentBulan, "Dana kapitasi JKN");
    }
  };

  const handleUptModalChange = (newUpt: string) => {
    setForm(prev => ({
      ...prev,
      kdUnit: newUpt,
      nomor_lpj: getNextNoLpj(newUpt)
    }));
    loadModalSummary(newUpt, form.bulan, form.sumdan);
  };

  const handleBulanModalChange = (newBulan: number) => {
    setForm(prev => ({
      ...prev,
      bulan: newBulan,
      keterangan: `Pengesahan Laporan Pertanggungjawaban (SPTJ) Periode ${BULAN_NAMA[newBulan]} ${tahun}`
    }));
    loadModalSummary(form.kdUnit, newBulan, form.sumdan);
  };

  const handleSumdanModalChange = (newSumdan: string) => {
    setForm(prev => ({ ...prev, sumdan: newSumdan }));
    loadModalSummary(form.kdUnit, form.bulan, newSumdan);
  };

  const handlePosting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.kdUnit) return alert("Pilih UPT terlebih dahulu");
    if (!form.nomor_lpj) return alert("Nomor Pengesahan LPJ harus diisi");

    if (modalExistingLpj) {
      const confirmOverwrite = await Swal.fire({
        title: "LPJ Sudah Pernah Disahkan!",
        html: `Periode <b>${BULAN_NAMA[form.bulan]} ${tahun} (${form.sumdan})</b> sudah pernah disahkan dengan nomor <b>${modalExistingLpj.no_lpj}</b>.<br/><br/>Apakah Anda ingin membatalkan dan menimpa pengesahan sebelumnya?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#EF4444",
        cancelButtonColor: "#64748B",
        confirmButtonText: "Ya, Timpa Pengesahan",
        cancelButtonText: "Batal"
      });

      if (!confirmOverwrite.isConfirmed) return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/pelaporan/lpj", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kd_upt: form.kdUnit,
          no_lpj: form.nomor_lpj,
          tgl_lpj: form.tanggal_pengesahan,
          bulan: form.bulan,
          tahun,
          sumdan: form.sumdan,
          keterangan: form.keterangan,
          force: !!modalExistingLpj
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);

      Swal.fire({
        icon: "success",
        title: "Sukses!",
        text: data.message || "Pengesahan LPJ berhasil disimpan & transaksi terkunci!",
        timer: 2000,
        showConfirmButton: false
      });
      setShowModal(false);
      loadData();
    } catch (e: any) {
      Swal.fire({
        icon: "error",
        title: "Gagal Mengesahkan LPJ",
        text: e.message || "Terjadi kesalahan saat mengesahkan LPJ"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (item: any) => {
    const result = await Swal.fire({
      title: "Batalkan Pengesahan LPJ?",
      text: `Pengesahan LPJ No: ${item.no_lpj} (${BULAN_NAMA[item.bulan]} ${item.tahun}) akan dibatalkan. Kunci transaksi akan dibuka kembali.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#64748B",
      confirmButtonText: "Ya, Batalkan",
      cancelButtonText: "Tidak"
    });

    if (!result.isConfirmed) return;

    try {
      const query = new URLSearchParams({
        kd_upt: item.kd_upt,
        bulan: item.bulan.toString(),
        tahun: item.tahun.toString(),
        sumdan: item.sumdan
      });
      const res = await fetch(`/api/pelaporan/lpj?${query.toString()}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error);

      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Pengesahan LPJ berhasil dibatalkan!",
        timer: 1500,
        showConfirmButton: false
      });
      loadData();
    } catch (e: any) {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: e.message || "Gagal membatalkan pengesahan LPJ"
      });
    }
  };

  const handleDetail = (kd_upt: string, no_lpj: string) => {
    router.push(`/dashboard/pelaporan/lpj/${kd_upt}/${encodeURIComponent(no_lpj)}`);
  };

  const handleCetak = (item: any) => {
    window.open(`/dashboard/pelaporan/lpj/cetak?bulan=${item.bulan}&tahun=${item.tahun}&kd_upt=${item.kd_upt}&sumdan=${encodeURIComponent(item.sumdan || "")}`, "_blank");
  };

  const canVerify = user && (["superadmin", "keuangan", "kpa"].includes(user.role) || user.level === 1);
  const formInputStyle = { background: "#F8FAFC", width: "100%", fontSize: 13, borderRadius: 6, border: "1px solid #E2E8F0", padding: "8px 12px" };

  return (
    <div className="animate-fadein relative">
      {/* Header Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>📑 Pengesahan LPJ</h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>Pengesahan Pertanggungjawaban Pendapatan & Belanja (SPTJ) BLUD</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {canVerify && (
            <button className="btn btn-primary" onClick={openModal}>
              <Plus size={16} /> Buat Pengesahan LPJ
            </button>
          )}
        </div>
      </div>

      {/* Main Card: Riwayat Pengesahan LPJ */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Riwayat Pengesahan LPJ / SPTJ (TA {tahun})</span>
        </div>

        {/* Filter Area matching Penetapan RBA UI */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569", zIndex: 10 }}>
              Show
              <div style={{ width: 75 }}>
                <Select
                  instanceId="limit-select"
                  menuPosition="fixed"
                  menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                  options={[
                    { value: 10, label: "10" },
                    { value: 25, label: "25" },
                    { value: 50, label: "50" },
                    { value: 100, label: "100" }
                  ]}
                  value={{ value: limit, label: limit.toString() }}
                  onChange={(v: any) => { setLimit(v.value); setPage(1); }}
                  styles={{
                    control: (b) => ({ ...b, minHeight: 34, borderRadius: 4, borderColor: "#E2E8F0", boxShadow: "none" }),
                    menuPortal: (b) => ({ ...b, zIndex: 9999 })
                  }}
                />
              </div>
              entries
            </div>

            {(user?.role === "superadmin" || user?.level === 1) && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569", zIndex: 10 }}>
                Filter UPT:
                <div style={{ minWidth: 260 }}>
                  <Select
                    instanceId="upt-select"
                    placeholder="Semua UPT"
                    isClearable
                    menuPosition="fixed"
                    menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                    options={upts.map((u: any) => ({ value: u.kd_upt, label: u.nm_upt }))}
                    value={filterUpt ? { value: filterUpt, label: upts.find(u => u.kd_upt === filterUpt)?.nm_upt || filterUpt } : null}
                    onChange={(v: any) => { setFilterUpt(v?.value || ""); setPage(1); }}
                    styles={{
                      control: (b) => ({ ...b, minHeight: 34, borderRadius: 4, borderColor: "#E2E8F0", boxShadow: "none" }),
                      menuPortal: (b) => ({ ...b, zIndex: 9999 })
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
              placeholder="Cari nomor LPJ / UPT..."
              style={{ ...formInputStyle, width: 220, padding: "6px 12px", borderRadius: 4, minHeight: 34 }}
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {/* Table Content matching Penetapan RBA layout */}
        {loading ? (
          <div className="empty-state" style={{ padding: 48 }}><div className="loading-spinner" /></div>
        ) : list.length === 0 ? (
          <div className="empty-state" style={{ padding: 48, fontSize: 13, color: "#64748B" }}>Tidak ada data riwayat pengesahan LPJ.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", borderTop: "1px solid #E2E8F0", borderBottom: "1px solid #E2E8F0" }}>
              <thead style={{ backgroundColor: "#F8FAFC" }}>
                <tr>
                  <th style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#1E293B", textTransform: "uppercase", textAlign: "center", width: 50, borderBottom: "1px solid #E2E8F0" }}>NO.</th>
                  <th style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#1E293B", textTransform: "uppercase", textAlign: "left", whiteSpace: "nowrap", borderBottom: "1px solid #E2E8F0" }}>NOMOR LPJ / SPTJ</th>
                  <th style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#1E293B", textTransform: "uppercase", textAlign: "left", whiteSpace: "nowrap", borderBottom: "1px solid #E2E8F0" }}>NAMA UPT</th>
                  <th style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#1E293B", textTransform: "uppercase", textAlign: "left", whiteSpace: "nowrap", borderBottom: "1px solid #E2E8F0" }}>PERIODE</th>
                  <th style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#1E293B", textTransform: "uppercase", textAlign: "left", whiteSpace: "nowrap", borderBottom: "1px solid #E2E8F0" }}>SUMBER DANA</th>
                  <th style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#1E293B", textTransform: "uppercase", textAlign: "left", minWidth: 180, borderBottom: "1px solid #E2E8F0" }}>KETERANGAN</th>
                  <th style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#1E293B", textTransform: "uppercase", textAlign: "center", borderBottom: "1px solid #E2E8F0" }}>STATUS</th>
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
                    <td style={{ padding: "16px 16px", fontSize: 12, color: "#0F172A", fontWeight: 700, fontFamily: "monospace", verticalAlign: "top" }}>
                      {item.no_lpj}
                    </td>
                    <td style={{ padding: "16px 16px", fontSize: 12, color: "#0F172A", fontWeight: 500, verticalAlign: "top" }}>
                      {item.nm_upt || item.kd_upt}
                    </td>
                    <td style={{ padding: "16px 16px", fontSize: 12, color: "#475569", verticalAlign: "top", whiteSpace: "nowrap" }}>
                      <b>{BULAN_NAMA[item.bulan]} {item.tahun}</b>
                      <div style={{ fontSize: 11, color: "#64748B" }}>
                        {item.tgl_lpj ? new Date(item.tgl_lpj).toLocaleDateString("id-ID") : "-"}
                      </div>
                    </td>
                    <td style={{ padding: "16px 16px", fontSize: 12, verticalAlign: "top" }}>
                      <span style={{ backgroundColor: "#F1F5F9", color: "#334155", padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, border: "1px solid #CBD5E1" }}>
                        {item.sumdan}
                      </span>
                    </td>
                    <td style={{ padding: "16px 16px", fontSize: 12, color: "#475569", verticalAlign: "top", maxWidth: 220, wordWrap: "break-word" }}>
                      {item.keterangan || "-"}
                    </td>
                    <td style={{ padding: "16px 16px", textAlign: "center", verticalAlign: "top" }}>
                      <span style={{ backgroundColor: "#DCFCE7", color: "#166534", padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                        {item.status ? item.status.toUpperCase() : "DISAHKAN"}
                      </span>
                    </td>
                    <td style={{ padding: "16px 16px", fontSize: 12, color: "#10B981", fontWeight: 700, textAlign: "right", verticalAlign: "top" }}>
                      {formatRupiah(Number(item.total_pendapatan) || 0)}
                    </td>
                    <td style={{ padding: "16px 16px", fontSize: 12, color: "#2563EB", fontWeight: 700, textAlign: "right", verticalAlign: "top" }}>
                      {formatRupiah(Number(item.total_belanja) || 0)}
                    </td>
                    <td style={{ padding: "16px 16px", textAlign: "center", verticalAlign: "top" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                        <button
                          onClick={() => handleDetail(item.kd_upt, item.no_lpj)}
                          title="Lihat Detail Transaksi"
                          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 4, border: "1px solid #BFDBFE", backgroundColor: "#EFF6FF", color: "#3B82F6", cursor: "pointer" }}
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleCetak(item)}
                          title="Cetak Dokumen SPTJ"
                          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 4, border: "1px solid #CBD5E1", backgroundColor: "#F8FAFC", color: "#475569", cursor: "pointer" }}
                        >
                          <Printer size={14} />
                        </button>
                        {canVerify && (
                          <button
                            onClick={() => handleDelete(item)}
                            title="Batalkan Pengesahan LPJ"
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

        {/* Pagination Controls matching Penetapan RBA UI */}
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

      {/* Modal Form Pengesahan LPJ (Mencontoh Form Penetapan RBA) */}
      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", width: 560, borderRadius: 12, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #E2E8F0" }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", margin: 0 }}>Pengesahan LPJ Baru</h2>
              <div style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>Kunci transaksi pendapatan & belanja untuk periode yang dipilih</div>
            </div>

            <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>
              <form id="lpjForm" onSubmit={handlePosting} style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {(user?.role === "superadmin" || user?.level === 1) && (
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#334155" }}>Pilih UPT Target <span style={{ color: "#EF4444" }}>*</span></label>
                    <Select
                      placeholder="Pilih UPT..."
                      menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                      options={upts.map((u: any) => ({ value: u.kd_upt, label: u.nm_upt }))}
                      value={form.kdUnit ? { value: form.kdUnit, label: upts.find(u => u.kd_upt === form.kdUnit)?.nm_upt || form.kdUnit } : null}
                      onChange={(v: any) => handleUptModalChange(v?.value || "")}
                      styles={{
                        control: (b) => ({ ...b, minHeight: 38, borderRadius: 6, borderColor: "#E2E8F0", boxShadow: "none" }),
                        menuPortal: (b) => ({ ...b, zIndex: 99999 })
                      }}
                    />
                  </div>
                )}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#334155" }}>Bulan <span style={{ color: "#EF4444" }}>*</span></label>
                    <select
                      className="form-select"
                      style={formInputStyle}
                      value={form.bulan}
                      onChange={(e) => handleBulanModalChange(parseInt(e.target.value))}
                      required
                    >
                      {BULAN_NAMA.slice(1).map((nm, i) => (
                        <option key={i + 1} value={i + 1}>{nm}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#334155" }}>Sumber Dana <span style={{ color: "#EF4444" }}>*</span></label>
                    <select
                      className="form-select"
                      style={formInputStyle}
                      value={form.sumdan}
                      onChange={(e) => handleSumdanModalChange(e.target.value)}
                      required
                    >
                      {sumberDanaOptions.map((sd, i) => (
                        <option key={i} value={sd}>{sd}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#334155" }}>Nomor / Tanda Pengesahan LPJ <span style={{ color: "#EF4444" }}>*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 00001/.../SPTJ/2026"
                    style={{ ...formInputStyle, fontFamily: "monospace", fontWeight: 600 }}
                    value={form.nomor_lpj}
                    onChange={(e) => setForm({ ...form, nomor_lpj: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#334155" }}>Tanggal Pengesahan <span style={{ color: "#EF4444" }}>*</span></label>
                  <input
                    type="date"
                    required
                    style={formInputStyle}
                    value={form.tanggal_pengesahan}
                    onChange={(e) => setForm({ ...form, tanggal_pengesahan: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, marginBottom: 8, color: "#334155" }}>Keterangan / Catatan</label>
                  <textarea
                    placeholder="Keterangan tambahan (opsional)"
                    rows={2}
                    style={{ ...formInputStyle, resize: "none" }}
                    value={form.keterangan}
                    onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                  />
                </div>

                {modalExistingLpj && (
                  <div style={{ padding: "12px 16px", backgroundColor: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 8, display: "flex", flexDirection: "column", gap: 4 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: "#991B1B", display: "flex", alignItems: "center", gap: 6 }}>
                      ⚠️ Peringatan: Periode Ini Sudah Pernah Disahkan!
                    </div>
                    <div style={{ fontSize: 11.5, color: "#B91C1C", lineHeight: "1.4" }}>
                      LPJ periode <b>{BULAN_NAMA[form.bulan]} {tahun} ({form.sumdan})</b> telah disahkan sebelumnya dengan Nomor Dokumen <b>{modalExistingLpj.no_lpj}</b> oleh <b>{modalExistingLpj.disahkan_oleh || 'Petugas'}</b>.
                    </div>
                  </div>
                )}

                {/* Ringkasan Nominal Otomatis */}
                <div style={{ backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: "12px 16px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", marginBottom: 8 }}>
                    Ringkasan Transaksi Yang Akan Disahkan ({BULAN_NAMA[form.bulan]} {tahun})
                  </div>
                  {modalPreviewLoading ? (
                    <div style={{ fontSize: 12, color: "#64748B", textAlign: "center", padding: 8 }}>
                      Menghitung nilai transaksi...
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 11, color: "#64748B" }}>Total Pendapatan:</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#10B981" }}>
                          Rp {formatRupiah(modalSummary?.totalPendapatan || 0)}
                        </div>
                        <div style={{ fontSize: 10, color: "#94A3B8" }}>{modalSummary?.countPendapatan || 0} Rekening</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "#64748B" }}>Total Belanja:</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#2563EB" }}>
                          Rp {formatRupiah(modalSummary?.totalBelanja || 0)}
                        </div>
                        <div style={{ fontSize: 10, color: "#94A3B8" }}>{modalSummary?.countBelanja || 0} Rekening</div>
                      </div>
                    </div>
                  )}
                  <div style={{ fontSize: 11, color: "#64748B", marginTop: 10, paddingTop: 8, borderTop: "1px dashed #CBD5E1" }}>
                    <strong>Info:</strong> Setelah disahkan, seluruh transaksi periode ini akan <b>terkunci</b> secara otomatis.
                  </div>
                </div>

              </form>
            </div>

            <div style={{ padding: "16px 24px", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "flex-end", gap: 12, backgroundColor: "#F8FAFC", borderBottomLeftRadius: 12, borderBottomRightRadius: 12 }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)} disabled={submitting}>
                Batal
              </button>
              <button type="submit" form="lpjForm" className="btn btn-primary" disabled={submitting || modalPreviewLoading} style={{ display: "inline-flex", alignItems: "center", gap: 6, backgroundColor: "#10B981", borderColor: "#10B981" }}>
                <ShieldCheck size={16} />
                {submitting ? "Menyimpan..." : "Sahkan LPJ Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
