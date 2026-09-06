"use client";

import { useState, useEffect } from "react";
import { Plus, Info, Pencil, Trash, CheckCircle, XCircle, ShieldCheck, FileText, Eye, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import Select from "react-select";
import Swal from "sweetalert2";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function formatRupiah(val: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
}

export default function PengeluaranPage() {
  const router = useRouter();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [upts, setUpts] = useState<any[]>([]);
  const [filterUpt, setFilterUpt] = useState("");
  const [user, setUser] = useState<any>(null);
  const [detailItem, setDetailItem] = useState<any>(null);
  const [totalNilai, setTotalNilai] = useState(0);
  const [totalVerified, setTotalVerified] = useState(0);
  const [totalUnverified, setTotalUnverified] = useState(0);
  const limit = 10;

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "Hapus Pengeluaran?",
      html: "Data pengeluaran akan dihapus dan <strong>status tagihan akan dikembalikan</strong> ke belum dibayar.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    });
    if (!result.isConfirmed) return;

    const res = await fetch(`/api/penatausahaan/belanja/pengeluaran/${id}`, { method: "DELETE" });
    if (res.ok) {
      Swal.fire("Terhapus!", "Data pengeluaran dihapus dan tagihan dikembalikan.", "success");
      loadData();
    } else {
      const err = await res.json();
      Swal.fire("Gagal!", err.error || "Gagal menghapus data", "error");
    }
  };

  const handleVerifikasi = async (id: number, action: "verifikasi" | "batal_verifikasi") => {
    const isVerif = action === "verifikasi";
    const textTitle = isVerif ? "Verifikasi Pengeluaran?" : "Batalkan Verifikasi?";
    const textMsg = isVerif
      ? "Data pengeluaran akan disahkan dan tidak dapat diedit atau dihapus."
      : "Status pengeluaran akan dikembalikan ke Draft / Belum Diverifikasi.";

    const result = await Swal.fire({
      title: textTitle,
      text: textMsg,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: isVerif ? "#10b981" : "#f59e0b",
      cancelButtonColor: "#64748b",
      confirmButtonText: isVerif ? "Ya, Verifikasi" : "Ya, Batalkan",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch("/api/penatausahaan/belanja/pengeluaran/verifikasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        Swal.fire("Berhasil!", data.message || "Status berhasil diperbarui.", "success");
        loadData();
      } else {
        Swal.fire("Gagal!", data.message || "Gagal memverifikasi pengeluaran", "error");
      }
    } catch (err: any) {
      Swal.fire("Error!", err.message || "Terjadi kesalahan sistem", "error");
    }
  };

  const loadData = () => {
    setLoading(true);
    fetch(`/api/penatausahaan/belanja/pengeluaran?page=${page}&limit=${limit}&search=${search}&kd_upt=${filterUpt}`)
      .then((r) => r.json())
      .then((d) => {
        setList(d.data || []);
        setTotalNilai(d.totalNilai || 0);
        setTotalVerified(d.totalVerified || 0);
        setTotalUnverified(d.totalUnverified || 0);
        setTotalPages(d.pagination?.totalPages || 1);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    fetch("/api/upt").then(r => r.json()).then(d => setUpts(d.data || []));
    fetch("/api/me").then(r => r.json()).then(d => setUser(d.user || null));
  }, []);

  useEffect(() => {
    loadData();
  }, [page, search, filterUpt]);

  // Hak Akses: Superadmin, KPA, dan Keuangan dapat memverifikasi pengeluaran
  const canVerify = user && (["superadmin", "kpa", "keuangan"].includes(user.role) || [1, 2, 4].includes(user.level));
  const canCreate = user && (["superadmin", "bendahara"].includes(user.role) || [1, 5].includes(user.level));

  return (
    <div className="animate-fadein">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>💸 Pengeluaran</h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>Pembukuan Tagihan menjadi Pengeluaran & Verifikasi Belanja</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {canCreate && (
            <button className="btn btn-primary" onClick={() => router.push("/dashboard/penatausahaan/belanja/pengeluaran/tambah")}>
              <Plus size={16} /> Bukukan Tagihan
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "linear-gradient(135deg, #1E293B, #0F172A)", color: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
          <p style={{ fontSize: 13, fontWeight: 500, opacity: 0.8 }}>Total Seluruh Pengeluaran</p>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 6 }}>{formatRupiah(totalNilai)}</h2>
        </div>
        <div style={{ background: "linear-gradient(135deg, #059669, #10B981)", color: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
          <p style={{ fontSize: 13, fontWeight: 500, opacity: 0.85 }}>Pengeluaran Terverifikasi</p>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 6 }}>{formatRupiah(totalVerified)}</h2>
        </div>
        <div style={{ background: "linear-gradient(135deg, #D97706, #F59E0B)", color: "#fff", padding: 20, borderRadius: 12, boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}>
          <p style={{ fontSize: 13, fontWeight: 500, opacity: 0.85 }}>Belum Diverifikasi (Draft)</p>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginTop: 6 }}>{formatRupiah(totalUnverified)}</h2>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ display: "flex", gap: 16, flexWrap: "wrap", borderBottom: "none", paddingBottom: 0 }}>
          {(user?.role === "superadmin" || user?.level === 1) && (
            <div style={{ minWidth: 300, flex: 1, maxWidth: 400 }}>
              <Select
                options={upts.map(u => ({ value: u.kd_upt, label: u.nm_upt }))}
                value={filterUpt ? { value: filterUpt, label: upts.find(u => u.kd_upt === filterUpt)?.nm_upt } : null}
                onChange={(selected: any) => setFilterUpt(selected?.value || "")}
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
            placeholder="Cari No. Pengeluaran, Vendor, Keterangan..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="tbl-wrap" style={{ marginTop: 20 }}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 40, textAlign: "center" }}>No</th>
                <th>UPT</th>
                <th>No. Pengeluaran</th>
                <th>Tgl Pengeluaran</th>
                <th>Vendor / Penerima</th>
                <th>Keterangan</th>
                <th>Sumber Dana</th>
                <th style={{ textAlign: "right" }}>Nilai (Rp)</th>
                <th style={{ textAlign: "center" }}>Status</th>
                <th style={{ textAlign: "center" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="text-center p-6 text-gray-500"><div className="loading-spinner" style={{ margin: "0 auto" }} /></td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={10} className="text-center p-6 text-gray-500">Belum ada data pengeluaran</td></tr>
              ) : (
                list.map((item, idx) => (
                  <tr key={item.id}>
                    <td style={{ textAlign: "center" }}>{(page - 1) * limit + idx + 1}</td>
                    <td>{item.nm_upt || "-"}</td>
                    <td style={{ fontWeight: 600, color: "#2563EB" }}>
                      {item.no_pengeluaran || "-"}
                      <br />
                      <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 'normal' }}>
                        Ref Tagihan: {item.tagihan?.no_tagihan || "-"}
                      </span>
                    </td>
                    <td>{item.tgl_pengeluaran ? new Date(item.tgl_pengeluaran).toLocaleDateString("id-ID") : "-"}</td>
                    <td>{item.nm_vendor || "-"}</td>
                    <td>{item.keterangan || "-"}</td>
                    <td>{Array.from(new Set(item.rincian?.map((r: any) => r.sumdan).filter(Boolean))).join(", ") || "-"}</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>{formatRupiah(item.nilai_pengeluaran || 0)}</td>
                    <td style={{ textAlign: "center" }}>
                      {item.verif === 1 ? (
                        <span className="badge badge-diverifikasi" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <CheckCircle size={12} /> Terverifikasi
                        </span>
                      ) : (
                        <span className="badge badge-draft" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <FileText size={12} /> Draft
                        </span>
                      )}
                      {item.verif === 1 && item.user_verif && (
                        <div style={{ fontSize: 10, color: "#64748B", marginTop: 2 }}>
                          Oleh: {item.user_verif}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <div style={{ display: "flex", gap: "6px", justifyContent: "center", alignItems: "center", flexWrap: "nowrap" }}>
                        {/* Tombol Edit & Hapus (Hanya jika belum diverifikasi) */}
                        {item.verif !== 1 && canCreate && (
                          <>
                            <button
                              onClick={() => router.push(`/dashboard/penatausahaan/belanja/pengeluaran/edit/${item.id}`)}
                              className="btn btn-outline btn-sm"
                              title="Edit Pengeluaran"
                            >
                              <Pencil size={12} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="btn btn-danger btn-sm"
                              title="Hapus Pengeluaran"
                            >
                              <Trash size={12} />
                            </button>
                          </>
                        )}

                        {/* Tombol Verifikasi & Batalkan Verifikasi (Superadmin, KPA, Keuangan) */}
                        {canVerify && (
                          item.verif === 1 ? (
                            <button
                              onClick={() => handleVerifikasi(item.id, "batal_verifikasi")}
                              className="btn btn-danger btn-sm"
                              title="Batalkan Verifikasi"
                              style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                            >
                              <XCircle size={12} /> Batal Verif
                            </button>
                          ) : (
                            <button
                              onClick={() => handleVerifikasi(item.id, "verifikasi")}
                              className="btn btn-warning btn-sm"
                              title="Verifikasi Pengeluaran"
                              style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
                            >
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

      {/* Dialog Detail */}
      <Dialog open={!!detailItem} onOpenChange={(open) => { if (!open) setDetailItem(null); }}>
        <DialogContent style={{ maxWidth: "700px", borderRadius: "12px" }}>
          <DialogHeader>
            <DialogTitle style={{ fontSize: "18px", fontWeight: 700 }}>
              Informasi Rincian Pengeluaran
            </DialogTitle>
          </DialogHeader>
          {detailItem && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px", fontSize: "14px" }}>
              <div style={{ backgroundColor: "#F8FAFC", padding: "12px", borderRadius: "8px", border: "1px solid #E2E8F0", gridColumn: "span 2" }}>
                <div style={{ color: "#64748B", fontSize: "12px", fontWeight: 600 }}>Nomor Pengeluaran</div>
                <div style={{ color: "#0F172A", fontWeight: 700, fontSize: "15px" }}>{detailItem.no_pengeluaran || "-"}</div>
              </div>
              <div style={{ backgroundColor: "#F8FAFC", padding: "12px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                <div style={{ color: "#64748B", fontSize: "12px", fontWeight: 600 }}>Status Verifikasi</div>
                <div style={{ marginTop: 4 }}>
                  {detailItem.verif === 1 ? (
                    <span className="badge badge-diverifikasi" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <CheckCircle size={12} /> Terverifikasi
                    </span>
                  ) : (
                    <span className="badge badge-draft" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <FileText size={12} /> Draft
                    </span>
                  )}
                </div>
              </div>
              <div style={{ backgroundColor: "#F8FAFC", padding: "12px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                <div style={{ color: "#64748B", fontSize: "12px", fontWeight: 600 }}>Verifikator</div>
                <div style={{ color: "#0F172A", fontWeight: 500 }}>
                  {detailItem.user_verif ? `${detailItem.user_verif} (${detailItem.tgl_verif ? new Date(detailItem.tgl_verif).toLocaleString("id-ID") : "-"})` : "Belum diverifikasi"}
                </div>
              </div>
              <div style={{ backgroundColor: "#F8FAFC", padding: "12px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                <div style={{ color: "#64748B", fontSize: "12px", fontWeight: 600 }}>UKM</div>
                <div style={{ color: "#0F172A", fontWeight: 500 }}>{detailItem.kd_ukm || "-"} - {detailItem.nm_ukm || "-"}</div>
              </div>
              <div style={{ backgroundColor: "#F8FAFC", padding: "12px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                <div style={{ color: "#64748B", fontSize: "12px", fontWeight: 600 }}>Peruntukan</div>
                <div style={{ color: "#0F172A", fontWeight: 500 }}>{detailItem.kd_peruntukan || "-"} - {detailItem.nm_peruntukan || "-"}</div>
              </div>
              <div style={{ backgroundColor: "#F8FAFC", padding: "12px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                <div style={{ color: "#64748B", fontSize: "12px", fontWeight: 600 }}>Komponen</div>
                <div style={{ color: "#0F172A", fontWeight: 500 }}>{detailItem.kd_komponen || "-"} - {detailItem.nm_komponen || "-"}</div>
              </div>
              <div style={{ backgroundColor: "#F8FAFC", padding: "12px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                <div style={{ color: "#64748B", fontSize: "12px", fontWeight: 600 }}>Rincian</div>
                <div style={{ color: "#0F172A", fontWeight: 500 }}>{detailItem.kd_rincian || "-"} - {detailItem.nm_rincian || "-"}</div>
              </div>
              <div style={{ backgroundColor: "#F8FAFC", padding: "12px", borderRadius: "8px", border: "1px solid #E2E8F0", gridColumn: "span 2" }}>
                <div style={{ color: "#64748B", fontSize: "12px", fontWeight: 600 }}>Sub Kegiatan</div>
                <div style={{ color: "#0F172A", fontWeight: 500 }}>{detailItem.kd_sub_kegiatan || "-"} - {detailItem.nm_sub_kegiatan || "-"}</div>
              </div>
              <div style={{ backgroundColor: "#F8FAFC", padding: "12px", borderRadius: "8px", border: "1px solid #E2E8F0", gridColumn: "span 2" }}>
                <div style={{ color: "#64748B", fontSize: "12px", fontWeight: 600 }}>Kode SPM</div>
                <div style={{ color: "#0F172A", fontWeight: 500 }}>{detailItem.kd_spm || "-"} - {detailItem.nm_spm || "-"}</div>
              </div>
              <div style={{ backgroundColor: "#F8FAFC", padding: "12px", borderRadius: "8px", border: "1px solid #E2E8F0", gridColumn: "span 2" }}>
                <div style={{ color: "#64748B", fontSize: "12px", fontWeight: 600 }}>Rekening (Rek 6)</div>
                <div style={{ color: "#0F172A", fontWeight: 500 }}>{detailItem.kd_rek6 || "-"} - {detailItem.nm_rek6 || "-"}</div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

