"use client";

import { useState, useEffect } from "react";
import { Plus, Edit3, Trash2, Search, ArrowRight, FileText, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Select from "react-select";
import Swal from "sweetalert2";

export default function RbaPage() {
  const router = useRouter();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [summaryBySumdan, setSummaryBySumdan] = useState<any[]>([]);

  const [user, setUser] = useState<any>(null);
  const [tahun, setTahun] = useState<string>("");

  const [upts, setUpts] = useState<any[]>([]);
  const [filterUpt, setFilterUpt] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [pukOptions, setPukOptions] = useState<any[]>([]);
  const [selectedPuk, setSelectedPuk] = useState<string>("");
  const [pukSearch, setPukSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [modalUpt, setModalUpt] = useState("");

  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printTgl, setPrintTgl] = useState("");
  const [printUpt, setPrintUpt] = useState("");

  const filteredPukOptions = pukOptions.filter(p => {
    const s = pukSearch.toLowerCase();
    return (
      (p.nmUkm || "").toLowerCase().includes(s) ||
      (p.nmPeruntukan || "").toLowerCase().includes(s) ||
      (p.nmKomponen || "").toLowerCase().includes(s) ||
      (p.nmRincian || "").toLowerCase().includes(s) ||
      (p.nmSubKegiatan || "").toLowerCase().includes(s)
    );
  });

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

    fetch(`/api/perencanaan/rba?${query.toString()}`)
      .then(r => r.json())
      .then(d => {
        setList(d.data || []);
        setTotal(d.pagination?.total || 0);
        setGrandTotal(d.grandTotal || 0);
        setSummaryBySumdan(d.summaryBySumdan || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user) loadData();
  }, [page, limit, q, filterUpt, user]);

  const loadPukOptions = async () => {
    try {
      const res = await fetch("/api/perencanaan/rba/puk-options");
      const d = await res.json();
      setPukOptions(d.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const openModal = () => {
    setSelectedPuk("");
    setPukSearch("");
    if (user?.role === "superadmin") {
      setModalUpt("");
      setPukOptions([]);
    } else {
      loadPukOptions();
    }
    setShowModal(true);
  };

  const handleCreateRba = async () => {
    if (!selectedPuk) return alert("Pilih PUK terlebih dahulu");
    setCreating(true);
    try {
      const res = await fetch("/api/perencanaan/rba/copy-from-puk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ puk_id: selectedPuk })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "RBA berhasil dibuat!",
        timer: 1500,
        showConfirmButton: false
      });

      setShowModal(false);
      loadData();
      router.push(`/dashboard/perencanaan/rba/${data.rba.no_rba}/rincian`);
    } catch (e: any) {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: e.message || "Gagal membuat RBA"
      });
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = (item: any) => {
    router.push(`/dashboard/perencanaan/rba/${item.no_rba}/rincian`);
  };

  const handleDelete = async (item: any) => {
    const result = await Swal.fire({
      title: "Batalkan RBA ini?",
      text: "Semua rincian di dalamnya akan terhapus dan kembali menjadi PUK yang dapat dipilih.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#64748B",
      confirmButtonText: "Ya, Batalkan",
      cancelButtonText: "Tidak"
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/perencanaan/rba/${item.no_rba}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "RBA berhasil dibatalkan!",
        timer: 1500,
        showConfirmButton: false
      });

      loadData();
    } catch (e: any) {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: e.message || "Gagal membatalkan RBA"
      });
    }
  };

  const handleCetak = () => {
    if (user?.role === "superadmin" && !printUpt) {
      return alert("Pilih UPT terlebih dahulu");
    }
    const dt = new Date(printTgl || new Date());
    const query = new URLSearchParams({
      tahun,
      tgl: dt.toISOString(),
      kd_upt: printUpt
    });
    window.open(`/dashboard/perencanaan/rba/cetak?${query.toString()}`, '_blank');
    setShowPrintModal(false);
  };

  const formInputStyle = { background: "#F8FAFC", width: "100%", fontSize: 13, borderRadius: 6, border: "1px solid #E2E8F0", padding: "8px 12px" };

  return (
    <div className="animate-fadein relative">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>💼 Rencana Bisnis dan Anggaran (RBA - Belanja)</h1>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="btn btn-outline" onClick={() => setShowPrintModal(true)}>
            <FileText size={16} /> Cetak RBA
          </button>
          <button className="btn btn-primary" onClick={openModal}>
            <Plus size={16} /> Buat RBA dari PUK
          </button>
        </div>
      </div>

      {/* Summary Card By Sumdan */}
      {summaryBySumdan.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
          {summaryBySumdan.map((s, idx) => (
            <div key={idx} className="card" style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 13, color: "#64748B", fontWeight: 600 }}>{s.sumdan}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#0F172A" }}>
                Rp {new Intl.NumberFormat('id-ID').format(s.total)}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <span className="card-title">Daftar RBA</span>
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
                      { value: 100, label: "100" }
                    ]}
                      value={{ value: limit, label: limit.toString() }}
                      onChange={(e: any) => { setLimit(e.value); setPage(1); }}
                      styles={{ control: (base) => ({ ...base, fontSize: 13, minHeight: 32 }), dropdownIndicator: (base) => ({ ...base, padding: 4 }) }}
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
                        styles={{ control: (base) => ({ ...base, fontSize: 13, minHeight: 32 }) }}
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
                  placeholder="Cari Sub Kegiatan / No RBA..."
                />
              </div>
            </div>

            {list.length === 0 ? (
              <div className="empty-state" style={{ padding: 48, borderTop: "1px solid #E2E8F0" }}>
                <div className="empty-state-icon">📄</div>
                <p style={{ fontWeight: 600 }}>Belum ada data RBA</p>
                <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>Klik tombol Buat RBA dari PUK untuk memulai</p>
              </div>
            ) : (
              <div className="tbl-wrap" style={{ borderRadius: 0 }}>
                <table className="tbl">
                  <thead>
                    <tr>
                      <th style={{ width: 40, textAlign: "center" }}>No.</th>
                      <th>Nama UPT</th>
                      <th>Sumber Dana</th>
                      <th>Upaya Kesehatan</th>
                      <th>Peruntukan</th>
                      <th>Komponen</th>
                      <th>Sub Komponen</th>
                      <th>Sub Kegiatan</th>
                      <th style={{ textAlign: "right", width: 140 }}>Nilai RBA (Rp)</th>
                      <th style={{ width: 90, textAlign: "center" }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((item, i) => (
                      <tr key={item.id}>
                        <td style={{ textAlign: "center", fontSize: 12, color: "#64748B" }}>{(page - 1) * limit + i + 1}</td>
                        <td style={{ fontSize: 13, color: "#334155", fontWeight: 600 }}>{item.nmUnit || "-"}</td>
                        <td style={{ fontSize: 13, color: "#334155", fontWeight: 500 }}>{item.sumdan || "-"}</td>
                        <td style={{ fontSize: 13, color: "#334155", fontWeight: 600 }}>{item.nmUkm}</td>
                        <td style={{ fontSize: 13, color: "#334155", fontWeight: 500 }}>{item.nmPeruntukan}</td>
                        <td style={{ fontSize: 13, color: "#334155" }}>{item.nmKomponen}</td>
                        <td style={{ fontSize: 13, color: "#334155" }}>{item.nmRincian}</td>
                        <td style={{ fontSize: 13, color: "#334155" }}>
                          <div>{item.nmSubKegiatan}</div>
                          <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{item.no_rba}</div>
                        </td>
                        <td style={{ textAlign: "right", fontSize: 13, fontWeight: 600, color: "#0F172A" }}>
                          {new Intl.NumberFormat('id-ID').format(item.nilai || 0)}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 5, justifyContent: "center" }}>
                            <button className="btn btn-outline btn-sm" onClick={() => handleEdit(item)} title="Edit Rincian">
                              <Edit3 size={12} />
                            </button>
                            <button className="btn btn-sm" style={{ background: "#FEE2E2", color: "#DC2626", borderColor: "#FECACA" }} onClick={() => handleDelete(item)} title="Batalkan/Hapus">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={8} style={{ textAlign: "right", fontWeight: 700, fontSize: 14, color: "#0F172A" }}>Jumlah Total (Rp.)</td>
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

      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#FFF", borderRadius: 8, padding: 24, width: 1000, maxWidth: "100%", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: "0 0 4px 0", fontSize: 18, color: "#0F172A", fontWeight: 700 }}>Pilih PUK untuk RBA</h3>
                <p style={{ fontSize: 13, color: "#64748B", margin: 0 }}>Pilih PUK yang belum dijadikan RBA dari daftar di bawah ini.</p>
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <input
                  type="text"
                  style={{ ...formInputStyle, width: 250 }}
                  value={pukSearch}
                  onChange={e => setPukSearch(e.target.value)}
                  placeholder="Cari..."
                />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", border: "1px solid #E2E8F0", borderRadius: 6, marginBottom: 20 }}>
              {user?.role === "superadmin" && !modalUpt ? (
                <table className="tbl">
                  <thead style={{ position: "sticky", top: 0, zIndex: 1, backgroundColor: "#F8FAFC" }}>
                    <tr>
                      <th style={{ width: 60, textAlign: "center" }}>Pilih</th>
                      <th style={{ width: 200 }}>Kode UPT</th>
                      <th>Nama UPT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upts.filter(u =>
                      u.nm_upt.toLowerCase().includes(pukSearch.toLowerCase()) ||
                      u.kd_upt.toLowerCase().includes(pukSearch.toLowerCase())
                    ).map(u => (
                      <tr
                        key={u.kd_upt}
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          setModalUpt(u.kd_upt);
                          setPukSearch("");
                          fetch(`/api/perencanaan/rba/puk-options?kd_upt=${u.kd_upt}`)
                            .then(r => r.json())
                            .then(d => setPukOptions(d.data || []));
                        }}
                      >
                        <td style={{ textAlign: "center" }}>
                          <input type="radio" checked={false} readOnly style={{ cursor: "pointer" }} />
                        </td>
                        <td style={{ fontSize: 13, color: "#334155" }}>{u.kd_upt}</td>
                        <td style={{ fontSize: 13, color: "#334155", fontWeight: 600 }}>{u.nm_upt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="tbl">
                  <thead style={{ position: "sticky", top: 0, zIndex: 1, backgroundColor: "#F8FAFC" }}>
                    <tr>
                      <th style={{ width: 40, textAlign: "center" }}>Pilih</th>
                      <th>Upaya Kesehatan</th>
                      <th>Peruntukan</th>
                      <th>Komponen</th>
                      <th>Sub Komponen</th>
                      <th>Sub Kegiatan</th>
                      <th style={{ textAlign: "right" }}>Nilai (Rp)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPukOptions.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: "center", padding: 32, color: "#64748B" }}>
                          Tidak ada PUK yang tersedia atau cocok dengan pencarian.
                        </td>
                      </tr>
                    ) : (
                      filteredPukOptions.map((p) => (
                        <tr
                          key={p.id}
                          style={{ cursor: "pointer", backgroundColor: selectedPuk === p.id ? "#EFF6FF" : "transparent" }}
                          onClick={() => setSelectedPuk(p.id)}
                        >
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="radio"
                              name="selectedPuk"
                              checked={selectedPuk === p.id}
                              onChange={() => setSelectedPuk(p.id)}
                              style={{ cursor: "pointer" }}
                            />
                          </td>
                          <td style={{ fontSize: 13, color: "#334155" }}>{p.nmUkm}</td>
                          <td style={{ fontSize: 13, color: "#334155" }}>{p.nmPeruntukan}</td>
                          <td style={{ fontSize: 13, color: "#334155" }}>{p.nmKomponen}</td>
                          <td style={{ fontSize: 13, color: "#334155" }}>{p.nmRincian}</td>
                          <td style={{ fontSize: 13, color: "#334155", fontWeight: 600 }}>{p.nmSubKegiatan}</td>
                          <td style={{ textAlign: "right", fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                            {new Intl.NumberFormat('id-ID').format(p.nilai || 0)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                {user?.role === "superadmin" && modalUpt && (
                  <button className="btn btn-outline" onClick={() => {
                    setModalUpt("");
                    setSelectedPuk("");
                    setPukOptions([]);
                    setPukSearch("");
                  }}>
                    <ArrowLeft size={16} /> Ganti UPT
                  </button>
                )}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-outline" onClick={() => setShowModal(false)} disabled={creating}>Batal</button>
                <button className="btn btn-primary" onClick={handleCreateRba} disabled={creating || !selectedPuk || (user?.role === "superadmin" && !modalUpt)}>
                  {creating ? "Memproses..." : "Buat RBA"} <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPrintModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#FFF", borderRadius: 8, padding: 24, width: 500, maxWidth: "100%" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: 18, color: "#0F172A", fontWeight: 700 }}>Cetak RBA</h3>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 600, color: "#334155" }}>Tanggal Cetak</label>
              <input
                type="date"
                style={formInputStyle}
                value={printTgl}
                onChange={e => setPrintTgl(e.target.value)}
              />
            </div>

            {user?.role === "superadmin" && (
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", marginBottom: 8, fontSize: 13, fontWeight: 600, color: "#334155" }}>Pilih UPT</label>
                <Select menuPosition="fixed" options={upts.map(u => ({ value: u.kd_upt, label: u.nm_upt }))}
                  value={printUpt ? { value: printUpt, label: upts.find(u => u.kd_upt === printUpt)?.nm_upt || printUpt } : null}
                  onChange={(e: any) => setPrintUpt(e.value)}
                  placeholder="Pilih UPT..."
                  styles={{ control: (base) => ({ ...base, fontSize: 13, minHeight: 38 }) }}
                />
              </div>
            )}

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn btn-outline" onClick={() => setShowPrintModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleCetak} disabled={user?.role === "superadmin" && !printUpt}>
                <FileText size={16} /> Cetak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
