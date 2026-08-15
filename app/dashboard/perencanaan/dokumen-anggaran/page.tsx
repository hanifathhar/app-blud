"use client";

import { useState, useEffect } from "react";
import { Search, Eye } from "lucide-react";
import Select from "react-select";
import { useRouter } from "next/navigation";

export default function DokumenAnggaranPage() {
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

  useEffect(() => {
    fetch("/api/me").then(r => r.json()).then(d => {
      if (d.user) {
        setUser(d.user);
        if (d.user.role === "superadmin") {
          fetch("/api/master/upt?limit=100").then(r => r.json()).then(res => setUpts(res.data || []));
        } else {
          setFilterUpt(d.user.kd_upt);
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

  const handleDetail = (kdUnit: string, nomor_penetapan: string) => {
    router.push(`/dashboard/perencanaan/dokumen-anggaran/${kdUnit}/${encodeURIComponent(nomor_penetapan)}`);
  };

  const formInputStyle = { background: "#F8FAFC", width: "100%", fontSize: 13, borderRadius: 6, border: "1px solid #E2E8F0", padding: "8px 12px" };

  return (
    <div className="animate-fadein relative">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>📄 Dokumen Anggaran</h1>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Daftar Dokumen Anggaran</span>
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
              placeholder="Cari dokumen..."
              style={{ ...formInputStyle, width: 220, padding: "6px 12px", borderRadius: 4, minHeight: 34 }}
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {/* Table Content */}
        {loading ? (
          <div className="empty-state" style={{ padding: 48 }}><div className="loading-spinner" /></div>
        ) : list.length === 0 ? (
          <div className="empty-state" style={{ padding: 48, fontSize: 13, color: "#64748B" }}>Tidak ada data dokumen anggaran.</div>
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
                        <button 
                          onClick={() => handleDetail(item.kdUnit, item.nomor_penetapan)} 
                          title="Lihat Detail"
                          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, borderRadius: 4, border: "1px solid #BFDBFE", backgroundColor: "#EFF6FF", color: "#3B82F6", cursor: "pointer" }}
                        >
                          <Eye size={14} />
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
    </div>
  );
}
