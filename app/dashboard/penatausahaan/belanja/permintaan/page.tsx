"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Select from "react-select";
import Swal from "sweetalert2";
import { Plus, CheckCircle, FileText, Pencil, Trash, XCircle, ShieldCheck } from "lucide-react";

function formatRupiah(val: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
}

export default function PermintaanBelanjaPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [upts, setUpts] = useState<any[]>([]);
  const [uptFilter, setUptFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  const loadData = () => {
    setLoading(true);
    let q = `?page=${page}&limit=${limit}`;
    if (uptFilter) q += `&kd_upt=${uptFilter}`;
    if (search) q += `&search=${search}`;

    fetch(`/api/penatausahaan/belanja/permintaan${q}`)
      .then((r) => r.json())
      .then((d) => {
        setList(d.data || []);
        setTotalPages(d.pagination?.totalPages || 1);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setPage(1);
  }, [uptFilter, search]);

  useEffect(() => {
    fetch("/api/me").then(r => r.json()).then(d => d.user && setUser(d.user));
    fetch("/api/master/upt").then(r => r.json()).then(d => setUpts(d.data || []));
  }, []);

  useEffect(() => {
    if (user) loadData();
  }, [user, uptFilter, search, page]);

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: 'Hapus Permintaan Belanja?',
      text: "Data yang dihapus tidak dapat dikembalikan!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Ya, Hapus',
      cancelButtonText: 'Batal'
    });

    if (!result.isConfirmed) return;

    const res = await fetch(`/api/penatausahaan/belanja/permintaan/${id}`, { method: "DELETE" });
    if (res.ok) {
      Swal.fire('Terhapus!', 'Data telah dihapus.', 'success');
      loadData();
    } else {
      const err = await res.json();
      Swal.fire('Gagal!', err.message || "Gagal menghapus data", 'error');
    }
  };

  // verifikasi will use a specific endpoint, assuming it exists or will be created
  const handleVerifikasi = async (id: number) => {
    // TODO: logic verifikasi 
  }

  const canCreate = user && ["superadmin", "bendahara", "operator"].includes(user.role);

  return (
    <div className="animate-fadein">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>📝 Permintaan Belanja</h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>Kelola pengajuan permintaan belanja barang/jasa</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {canCreate && (
            <Link href="/dashboard/penatausahaan/belanja/permintaan/tambah">
              <button className="btn btn-primary">
                <Plus size={16} /> Tambah Permintaan
              </button>
            </Link>
          )}
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
            placeholder="Cari No. Permintaan, Uraian..."
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
                <th>No. Permintaan</th>
                <th>Tgl Permintaan</th>
                <th>Uraian</th>
                <th>Sumber Dana</th>
                <th style={{ textAlign: "right" }}>Total Nilai (Rp)</th>
                <th style={{ textAlign: "center" }}>Status</th>
                <th style={{ textAlign: "center" }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center p-6 text-gray-500"><div className="loading-spinner" style={{ margin: "0 auto" }} /></td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={9} className="text-center p-6 text-gray-500">Belum ada data permintaan belanja</td></tr>
              ) : (
                list.map((item, idx) => (
                  <tr key={item.id}>
                    <td style={{ textAlign: "center" }}>{(page - 1) * limit + idx + 1}</td>
                    <td>{upts.find(u => u.kd_upt === item.kd_upt)?.nm_upt || item.kd_upt || "-"}</td>
                    <td style={{ fontWeight: 600, color: "#2563EB" }}>{item.no_permintaan || "-"}</td>
                    <td>{item.tgl_permintaan ? new Date(item.tgl_permintaan).toLocaleDateString("id-ID") : "-"}</td>
                    <td>{item.keterangan || "-"}</td>
                    <td>{Array.from(new Set(item.rincian?.map((r: any) => r.sumdan).filter(Boolean))).join(", ") || "-"}</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>
                      {formatRupiah(item.rincian?.reduce((sum: number, r: any) => sum + Number(r.total || 0), 0) || 0)}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {item.status === "disetujui" ? (
                        <span className="badge badge-diverifikasi">
                          <CheckCircle size={12} /> Disetujui
                        </span>
                      ) : item.status === "draft" ? (
                        <span className="badge badge-draft">
                          <FileText size={12} /> Draft
                        </span>
                      ) : (
                        <span className="badge" style={{ backgroundColor: "#e0e7ff", color: "#3730a3" }}>
                          {item.status}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                        {/* Aksi khusus draft */}
                        {item.status === "draft" && canCreate && (
                          <>
                            <Link href={`/dashboard/penatausahaan/belanja/permintaan/edit/${item.id}`}>
                              <button className="btn btn-outline btn-sm" title="Edit">
                                <Pencil size={12} />
                              </button>
                            </Link>
                            <button onClick={() => handleDelete(item.id)} className="btn btn-danger btn-sm" title="Hapus">
                              <Trash size={12} />
                            </button>
                          </>
                        )}
                        {/* Aksi khusus disetujui */}
                        {item.status === "disetujui" && canCreate && (
                          <>
                            {item.jenis_permintaan === "non_pengadaan" ? (
                              <Link href={`/dashboard/penatausahaan/belanja/tagihan/tambah?permintaan_id=${item.id}`}>
                                <button className="btn btn-outline btn-sm" title="Buat Tagihan" style={{ fontSize: 11, padding: "4px 8px" }}>
                                  Buat Tagihan
                                </button>
                              </Link>
                            ) : (
                              <Link href={`/dashboard/penatausahaan/belanja/pengadaan/tambah?permintaan_id=${item.id}`}>
                                <button className="btn btn-outline btn-sm" title="Buat Pengadaan" style={{ fontSize: 11, padding: "4px 8px" }}>
                                  Buat Pengadaan
                                </button>
                              </Link>
                            )}
                          </>
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
    </div>
  );
}
