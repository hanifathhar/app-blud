"use client";

import React, { useState, useEffect, use } from "react";
import { ArrowLeft, Building, Calendar, FileText, ChevronDown, ChevronRight, Printer, ShieldCheck, Check } from "lucide-react";
import { useRouter } from "next/navigation";

const BULAN_NAMA = [
  "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

function formatRupiah(val: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val || 0);
}

export default function Sp3bDetailPage({ params }: { params: Promise<{ kdUnit: string; no_sp3b: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const kdUnit = resolvedParams.kdUnit;
  const no_sp3b = decodeURIComponent(resolvedParams.no_sp3b);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [collapsedSub, setCollapsedSub] = useState<Record<string, boolean>>({});

  const toggleSub = (key: string) => {
    setCollapsedSub((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const loadDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/verifikasi/sp3b/detail?kd_upt=${kdUnit}&no_sp3b=${encodeURIComponent(no_sp3b)}`);
      const result = await res.json();
      if (res.ok && result.success) {
        setData(result.data);
      } else {
        setData(null);
      }
    } catch (e) {
      console.error("Gagal memuat detail SP3B", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [kdUnit, no_sp3b]);

  const handleCetak = () => {
    if (!data) return;
    window.open(`/dashboard/verifikasi/sp3b/cetak?no_sp3b=${encodeURIComponent(no_sp3b)}&kd_upt=${kdUnit}`, "_blank");
  };

  // Grouping rincian belanja per Sub Kegiatan
  const belanjaGrouped: Record<string, { kd_sub_kegiatan: string; nm_sub_kegiatan: string; items: any[]; total: number }> = {};
  if (data?.rincianBelanja) {
    data.rincianBelanja.forEach((b: any) => {
      const subKey = b.kd_sub_kegiatan || "0.00.00.0.00.00";
      if (!belanjaGrouped[subKey]) {
        belanjaGrouped[subKey] = {
          kd_sub_kegiatan: subKey,
          nm_sub_kegiatan: b.nm_sub_kegiatan || "-",
          items: [],
          total: 0,
        };
      }
      belanjaGrouped[subKey].items.push(b);
      belanjaGrouped[subKey].total += Number(b.nilai) || 0;
    });
  }

  const subKegiatanList = Object.values(belanjaGrouped);
  const rincianPendapatan = data?.rincianPendapatan || [];

  return (
    <div className="animate-fadein relative">
      {/* Header Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={() => router.push("/dashboard/verifikasi/sp3b")}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 8, border: "1px solid #E2E8F0", backgroundColor: "#fff", cursor: "pointer" }}
            title="Kembali ke Daftar SP3B"
          >
            <ArrowLeft size={18} color="#475569" />
          </button>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", display: "flex", alignItems: "center", gap: 8 }}>
              Detail Dokumen SP3B
              <span style={{ backgroundColor: "#DCFCE7", color: "#166534", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5 }}>
                <ShieldCheck size={14} /> TERVERIFIKASI DINAS
              </span>
            </h1>
            <div style={{ fontSize: 14, color: "#64748B", marginTop: 4 }}>
              Nomor SP3B: <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#0F172A" }}>{no_sp3b}</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            className="btn btn-outline"
            onClick={handleCetak}
            disabled={!data}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, backgroundColor: "#fff" }}
          >
            <Printer size={16} /> Cetak Dokumen SP3B
          </button>
        </div>
      </div>

      {/* Form Informasi Dokumen SP3B */}
      {data && (
        <div className="card" style={{ marginBottom: 24, overflow: "hidden", border: "1px solid #E2E8F0", borderRadius: 12 }}>
          <div
            style={{
              padding: "16px 24px",
              background: "linear-gradient(to right, #F8FAFC, #FFFFFF)",
              borderBottom: "1px solid #E2E8F0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: "#EFF6FF", color: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #BFDBFE" }}>
                <FileText size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: "#0F172A", margin: 0 }}>
                  Informasi Surat Permintaan Pengesahan Pendapatan & Belanja
                </h2>
                <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>
                  Dokumen legal pengesahan pendapatan & belanja BLUD UPT oleh Dinas Kesehatan
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: "20px 24px", backgroundColor: "#FFFFFF" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 16 }}>
              {/* Unit Kerja */}
              <div style={{ gridColumn: "span 6", minWidth: 260 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 6, textTransform: "uppercase" }}>
                  <Building size={13} color="#2563EB" /> Unit Kerja (UPT)
                </div>
                <div style={{ padding: "10px 14px", borderRadius: 8, backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>{data.nm_upt}</div>
                  <div style={{ fontSize: 11, color: "#64748B", fontFamily: "monospace", marginTop: 2 }}>Kode: {data.kd_upt}</div>
                </div>
              </div>

              {/* Ref LPJ */}
              <div style={{ gridColumn: "span 6", minWidth: 260 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 6, textTransform: "uppercase" }}>
                  <FileText size={13} color="#2563EB" /> Referensi Dokumen LPJ (UPT)
                </div>
                <div style={{ padding: "10px 14px", borderRadius: 8, backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A", fontFamily: "monospace", wordBreak: "break-all" }}>
                    {data.no_lpj || "-"}
                  </div>
                  <div style={{ fontSize: 11, color: "#15803D", fontWeight: 600, marginTop: 2 }}>Dokumen Terkunci dari UPT</div>
                </div>
              </div>

              {/* Periode SP3B */}
              <div style={{ gridColumn: "span 3", minWidth: 160 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 6, textTransform: "uppercase" }}>
                  <Calendar size={13} color="#2563EB" /> Periode SP3B
                </div>
                <div style={{ padding: "10px 14px", borderRadius: 8, backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>{BULAN_NAMA[data.bulan]}</div>
                  <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Bulan ke-{data.bulan}</div>
                </div>
              </div>

              {/* Tanggal SP3B */}
              <div style={{ gridColumn: "span 3", minWidth: 160 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 6, textTransform: "uppercase" }}>
                  <Calendar size={13} color="#2563EB" /> Tanggal Dokumen
                </div>
                <div style={{ padding: "10px 14px", borderRadius: 8, backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>
                    {data.tgl_sp3b ? new Date(data.tgl_sp3b).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
                  </div>
                  <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Tanggal Terbit SP3B</div>
                </div>
              </div>

              {/* Sumber Dana */}
              <div style={{ gridColumn: "span 3", minWidth: 160 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 6, textTransform: "uppercase" }}>
                  <FileText size={13} color="#2563EB" /> Sumber Dana
                </div>
                <div style={{ padding: "10px 14px", borderRadius: 8, backgroundColor: "#EFF6FF", border: "1px solid #DBEAFE" }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "#1E40AF" }}>{data.sumdan || "Semua Dana"}</div>
                  <div style={{ fontSize: 11, color: "#3B82F6", marginTop: 2 }}>Kas BLUD</div>
                </div>
              </div>

              {/* Verifikator */}
              <div style={{ gridColumn: "span 3", minWidth: 160 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 6, textTransform: "uppercase" }}>
                  <ShieldCheck size={13} color="#2563EB" /> Petugas Verifikator
                </div>
                <div style={{ padding: "10px 14px", borderRadius: 8, backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>{data.username || "Dinas Kesehatan"}</div>
                  <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>Verifikator Dinkes</div>
                </div>
              </div>

              {/* Uraian / Keterangan */}
              <div style={{ gridColumn: "span 12" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: "#64748B", marginBottom: 6, textTransform: "uppercase" }}>
                  <FileText size={13} color="#2563EB" /> Catatan / Uraian SP3B
                </div>
                <div style={{ padding: "10px 14px", borderRadius: 8, backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0", fontSize: 13, color: "#334155", fontWeight: 500 }}>
                  {data.ket || "-"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabel 1: Rincian Pendapatan SP3B */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, backgroundColor: "#F0FDF4", borderBottom: "1px solid #BBF7D0" }}>
          <div>
            <span className="card-title" style={{ color: "#166534", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ backgroundColor: "#DCFCE7", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>4.x.x</span>
              Rincian Pengesahan Pendapatan SP3B
            </span>
            <div style={{ fontSize: 12, color: "#15803D", marginTop: 2 }}>
              {rincianPendapatan.length} Rekening Pendapatan Disahkan
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#15803D", textTransform: "uppercase" }}>Total Pendapatan</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#166534" }}>{formatRupiah(data?.total_pendapatan || 0)}</div>
          </div>
        </div>

        {loading ? (
          <div className="empty-state" style={{ padding: 36 }}><div className="loading-spinner" /></div>
        ) : !data ? (
          <div className="empty-state" style={{ padding: 36, fontSize: 13, color: "#64748B" }}>Data dokumen SP3B tidak ditemukan.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ backgroundColor: "#F8FAFC" }}>
                <tr>
                  <th style={{ padding: "10px 16px", fontSize: 11, fontWeight: 700, color: "#1E293B", textTransform: "uppercase", textAlign: "center", width: 150, borderBottom: "1px solid #E2E8F0" }}>Kode Rekening</th>
                  <th style={{ padding: "10px 16px", fontSize: 11, fontWeight: 700, color: "#1E293B", textTransform: "uppercase", textAlign: "left", borderBottom: "1px solid #E2E8F0" }}>Uraian Rekening Pendapatan</th>
                  <th style={{ padding: "10px 16px", fontSize: 11, fontWeight: 700, color: "#1E293B", textTransform: "uppercase", textAlign: "right", width: 220, borderBottom: "1px solid #E2E8F0" }}>Jumlah Pengesahan (Rp)</th>
                </tr>
              </thead>
              <tbody>
                {rincianPendapatan.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ padding: "24px 16px", fontSize: 12, color: "#94A3B8", fontStyle: "italic", textAlign: "center" }}>
                      Tidak ada transaksi pendapatan (Nihil)
                    </td>
                  </tr>
                ) : (
                  rincianPendapatan.map((p: any, idx: number) => (
                    <tr key={`p-${idx}`} style={{ borderBottom: "1px solid #E2E8F0", backgroundColor: "#FFFFFF" }} className="hover:bg-slate-50/50">
                      <td style={{ padding: "10px 16px", fontSize: 11.5, color: "#475569", fontFamily: "monospace", textAlign: "center", verticalAlign: "top", fontWeight: 600 }}>
                        {p.kd_rek6}
                      </td>
                      <td style={{ padding: "10px 16px", fontSize: 12, verticalAlign: "top" }}>
                        <div style={{ fontWeight: 600, color: "#0F172A" }}>{p.nm_rek6}</div>
                      </td>
                      <td style={{ padding: "10px 16px", fontSize: 12.5, color: "#10B981", fontWeight: 700, textAlign: "right", verticalAlign: "top" }}>
                        {formatRupiah(p.nilai)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: "#F0FDF4", borderTop: "2px solid #BBF7D0", fontWeight: 800 }}>
                  <td colSpan={2} style={{ padding: "12px 16px", fontSize: 12.5, color: "#166534", textTransform: "uppercase" }}>
                    Total Realisasi Pendapatan Disahkan
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13.5, color: "#166534", textAlign: "right" }}>
                    {formatRupiah(data.total_pendapatan || 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Tabel 2: Rincian Belanja SP3B */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, backgroundColor: "#EFF6FF", borderBottom: "1px solid #BFDBFE" }}>
          <div>
            <span className="card-title" style={{ color: "#1E40AF", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ backgroundColor: "#DBEAFE", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700 }}>5.x.x</span>
              Rincian Pengesahan Belanja SP3B
            </span>
            <div style={{ fontSize: 12, color: "#1D4ED8", marginTop: 2 }}>
              {subKegiatanList.length} Sub Kegiatan Disahkan
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#1D4ED8", textTransform: "uppercase" }}>Total Belanja</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#1E40AF" }}>{formatRupiah(data?.total_belanja || 0)}</div>
          </div>
        </div>

        {loading ? (
          <div className="empty-state" style={{ padding: 36 }}><div className="loading-spinner" /></div>
        ) : !data ? (
          <div className="empty-state" style={{ padding: 36, fontSize: 13, color: "#64748B" }}>Data dokumen SP3B tidak ditemukan.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ backgroundColor: "#F8FAFC" }}>
                <tr>
                  <th style={{ padding: "10px 16px", fontSize: 11, fontWeight: 700, color: "#1E293B", textTransform: "uppercase", textAlign: "center", width: 140, borderBottom: "1px solid #E2E8F0" }}>Kode</th>
                  <th colSpan={2} style={{ padding: "10px 16px", fontSize: 11, fontWeight: 700, color: "#1E293B", textTransform: "uppercase", textAlign: "left", borderBottom: "1px solid #E2E8F0" }}>Uraian Sub Kegiatan / Rekening Belanja</th>
                  <th style={{ padding: "10px 16px", fontSize: 11, fontWeight: 700, color: "#1E293B", textTransform: "uppercase", textAlign: "right", width: 220, borderBottom: "1px solid #E2E8F0" }}>Jumlah Pengesahan (Rp)</th>
                </tr>
              </thead>
              <tbody>
                {subKegiatanList.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: "24px 16px", fontSize: 12, color: "#94A3B8", fontStyle: "italic", textAlign: "center" }}>
                      Tidak ada transaksi pengeluaran belanja (Nihil)
                    </td>
                  </tr>
                ) : (
                  subKegiatanList.map((sub, sIdx) => {
                    const isCollapsed = collapsedSub[sub.kd_sub_kegiatan] || false;
                    return (
                      <React.Fragment key={`sub-${sIdx}`}>
                        {/* Sub Kegiatan Header */}
                        <tr
                          onClick={() => toggleSub(sub.kd_sub_kegiatan)}
                          style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #CBD5E1", cursor: "pointer" }}
                          className="hover:bg-slate-200/50 transition-colors"
                        >
                          <td style={{ padding: "10px 16px", fontSize: 12, fontWeight: 700, color: "#0F172A", textAlign: "center", verticalAlign: "top" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                              {isCollapsed ? <ChevronRight size={15} color="#64748B" /> : <ChevronDown size={15} color="#64748B" />}
                              {sub.kd_sub_kegiatan}
                            </div>
                          </td>
                          <td colSpan={2} style={{ padding: "10px 16px", verticalAlign: "top" }}>
                            <div style={{ fontSize: 12.5, fontWeight: 700, color: "#0F172A" }}>{sub.nm_sub_kegiatan}</div>
                            <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                              {sub.items.length} Rincian Rekening
                            </div>
                          </td>
                          <td style={{ padding: "10px 16px", fontSize: 12.5, fontWeight: 800, color: "#0F172A", textAlign: "right", verticalAlign: "top" }}>
                            {formatRupiah(sub.total)}
                          </td>
                        </tr>

                        {/* Rincian Rekening Belanja */}
                        {!isCollapsed &&
                          sub.items.map((b: any, bIdx: number) => (
                            <tr key={`sub-${sIdx}-item-${bIdx}`} style={{ borderBottom: "1px solid #E2E8F0", backgroundColor: "#FFFFFF" }} className="hover:bg-slate-50/50">
                              <td style={{ padding: "10px 16px", fontSize: 11, color: "#64748B", fontFamily: "monospace", textAlign: "center", verticalAlign: "top" }}>
                                {b.kd_rek6}
                              </td>
                              <td style={{ padding: "10px 16px", width: 30, verticalAlign: "top" }}>
                                <div style={{ width: 10, height: 10, borderLeft: "2px solid #CBD5E1", borderBottom: "2px solid #CBD5E1", marginLeft: 10, marginTop: 4 }} />
                              </td>
                              <td style={{ padding: "10px 16px", fontSize: 12, verticalAlign: "top", paddingLeft: 0 }}>
                                <div style={{ fontWeight: 600, color: "#0F172A" }}>{b.nm_rek6}</div>
                              </td>
                              <td style={{ padding: "10px 16px", fontSize: 12, color: "#2563EB", fontWeight: 700, textAlign: "right", verticalAlign: "top" }}>
                                {formatRupiah(b.nilai)}
                              </td>
                            </tr>
                          ))}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: "#EFF6FF", borderTop: "2px solid #BFDBFE", fontWeight: 800 }}>
                  <td colSpan={3} style={{ padding: "12px 16px", fontSize: 12.5, color: "#1E40AF", textTransform: "uppercase" }}>
                    Total Realisasi Belanja Disahkan
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13.5, color: "#1E40AF", textAlign: "right" }}>
                    {formatRupiah(data.total_belanja || 0)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Action Bar di Bawah */}
      {data && (
        <div
          className="card"
          style={{
            padding: "16px 24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 16,
            backgroundColor: "#FFFFFF",
            boxShadow: "0 -2px 10px rgba(0, 0, 0, 0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#64748B" }}>
            <span>Total Transaksi Disahkan:</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: "#0F172A" }}>
              {formatRupiah((data.total_pendapatan || 0) + (data.total_belanja || 0))}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => router.push("/dashboard/verifikasi/sp3b")}
              style={{ padding: "8px 18px", fontSize: 13, backgroundColor: "#fff" }}
            >
              Kembali
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleCetak}
              style={{ padding: "8px 20px", fontSize: 13, display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              <Printer size={15} /> Cetak Dokumen SP3B
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
