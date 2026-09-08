"use client";

import React, { useState, useEffect, use } from "react";
import { ArrowLeft, Building, Calendar, FileText, ChevronDown, ChevronRight, Printer, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

const BULAN_NAMA = [
  "", "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

function formatRupiah(val: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val || 0);
}

export default function LpjDetailPage({ params }: { params: Promise<{ kdUnit: string; no_lpj: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const kdUnit = resolvedParams.kdUnit;
  const no_lpj = decodeURIComponent(resolvedParams.no_lpj);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [collapsedSub, setCollapsedSub] = useState<Record<string, boolean>>({});

  const toggleSub = (key: string) => {
    setCollapsedSub(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const loadDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pelaporan/lpj/detail?kdUnit=${kdUnit}&no_lpj=${encodeURIComponent(no_lpj)}`);
      const result = await res.json();
      if (res.ok && result.success) {
        setData(result.data);
      } else {
        setData(null);
      }
    } catch (e) {
      console.error("Gagal memuat detail LPJ", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [kdUnit, no_lpj]);

  const handleCetak = () => {
    if (!data) return;
    window.open(`/dashboard/pelaporan/lpj/cetak?bulan=${data.bulan}&tahun=${data.tahun}&kd_upt=${data.kd_upt}&sumdan=${encodeURIComponent(data.sumdan || "")}`, "_blank");
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
      belanjaGrouped[subKey].total += Number(b.jumlah) || 0;
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
            onClick={() => router.push("/dashboard/pelaporan/lpj")}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 8, border: "1px solid #E2E8F0", backgroundColor: "#fff", cursor: "pointer" }}
            title="Kembali ke Daftar LPJ"
          >
            <ArrowLeft size={18} color="#475569" />
          </button>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", display: "flex", alignItems: "center", gap: 8 }}>
              Detail Pengesahan LPJ
              <span style={{ backgroundColor: "#DCFCE7", color: "#166534", padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>
                <ShieldCheck size={13} /> {data?.status?.toUpperCase() || "DISAHKAN"}
              </span>
            </h1>
            <div style={{ fontSize: 14, color: "#64748B", marginTop: 4 }}>
              Nomor: <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#0F172A" }}>{no_lpj}</span>
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
            <Printer size={16} /> Cetak Dokumen SPTJ
          </button>
        </div>
      </div>

      {/* Info Cards */}
      {data && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
          <div className="card" style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>
              <Building size={14} /> Unit Kerja (UPT)
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>{data.nm_upt}</div>
            <div style={{ fontSize: 11, color: "#64748B" }}>Kode: {data.kd_upt}</div>
          </div>

          <div className="card" style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>
              <Calendar size={14} /> Periode & Tanggal
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>
              {BULAN_NAMA[data.bulan]} {data.tahun}
            </div>
            <div style={{ fontSize: 11, color: "#64748B" }}>
              Tgl Pengesahan: {data.tgl_lpj ? new Date(data.tgl_lpj).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"}
            </div>
          </div>

          <div className="card" style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>
              <FileText size={14} /> Sumber Dana & Pengesah
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#3B82F6" }}>{data.sumdan || "-"}</div>
            <div style={{ fontSize: 11, color: "#64748B" }}>Disahkan oleh: {data.disahkan_oleh || "Subag Keuangan"}</div>
          </div>

          <div className="card" style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>
              <FileText size={14} /> Catatan / Keterangan
            </div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "#334155", lineHeight: "1.4" }}>
              {data.keterangan || "-"}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Card: Rincian Struktur Transaksi */}
      <div className="card">
        <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <span className="card-title">Struktur Transaksi Pengesahan LPJ</span>
          <div style={{ display: "flex", gap: 20 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase" }}>Total Pendapatan</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#10B981" }}>{formatRupiah(data?.total_pendapatan || 0)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase" }}>Total Belanja</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: "#2563EB" }}>{formatRupiah(data?.total_belanja || 0)}</div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="empty-state" style={{ padding: 48 }}><div className="loading-spinner" /></div>
        ) : !data ? (
          <div className="empty-state" style={{ padding: 48, fontSize: 13, color: "#64748B" }}>Data dokumen LPJ tidak ditemukan.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", borderTop: "1px solid #E2E8F0" }}>
              <thead style={{ backgroundColor: "#F8FAFC" }}>
                <tr>
                  <th style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#1E293B", textTransform: "uppercase", textAlign: "center", width: 80, borderBottom: "1px solid #E2E8F0" }}>JENIS / KODE</th>
                  <th colSpan={2} style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#1E293B", textTransform: "uppercase", textAlign: "left", borderBottom: "1px solid #E2E8F0" }}>URAIAN SUB KEGIATAN / REKENING</th>
                  <th style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#1E293B", textTransform: "uppercase", textAlign: "right", width: 220, borderBottom: "1px solid #E2E8F0" }}>JUMLAH (RP)</th>
                </tr>
              </thead>
              <tbody>
                {/* 1. BAGIAN PENDAPATAN */}
                <tr style={{ backgroundColor: "#F0FDF4", borderBottom: "2px solid #BBF7D0" }}>
                  <td style={{ padding: "12px 16px", fontSize: 12, fontWeight: 700, color: "#166534", textAlign: "center" }}>
                    4.x.x
                  </td>
                  <td colSpan={2} style={{ padding: "12px 16px" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#166534", textTransform: "uppercase" }}>PENDAPATAN BLUD</div>
                    <div style={{ fontSize: 11, color: "#15803D", marginTop: 2 }}>{rincianPendapatan.length} Rekening Pendapatan</div>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 800, color: "#166534", textAlign: "right" }}>
                    {formatRupiah(data.total_pendapatan || 0)}
                  </td>
                </tr>

                {rincianPendapatan.length === 0 ? (
                  <tr style={{ borderBottom: "1px solid #E2E8F0" }}>
                    <td></td>
                    <td colSpan={3} style={{ padding: "12px 16px", fontSize: 12, color: "#94A3B8", fontStyle: "italic", textAlign: "center" }}>
                      Tidak ada transaksi penerimaan pendapatan (Nihil)
                    </td>
                  </tr>
                ) : (
                  rincianPendapatan.map((p: any, idx: number) => (
                    <tr key={`p-${idx}`} style={{ borderBottom: "1px solid #E2E8F0", backgroundColor: "#FFFFFF" }} className="hover:bg-slate-50/50">
                      <td style={{ padding: "10px 16px", fontSize: 11, color: "#475569", fontFamily: "monospace", textAlign: "center", verticalAlign: "top" }}>
                        {p.kd_rek6}
                      </td>
                      <td style={{ padding: "10px 16px", width: 40, verticalAlign: "top" }}>
                        <div style={{ width: 12, height: 12, borderLeft: "2px solid #CBD5E1", borderBottom: "2px solid #CBD5E1", marginLeft: 12, marginTop: 4 }} />
                      </td>
                      <td style={{ padding: "10px 16px", fontSize: 12, verticalAlign: "top", paddingLeft: 0 }}>
                        <div style={{ fontWeight: 600, color: "#0F172A" }}>{p.nm_rek6}</div>
                        {p.keterangan && <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{p.keterangan}</div>}
                      </td>
                      <td style={{ padding: "10px 16px", fontSize: 12, color: "#10B981", fontWeight: 700, textAlign: "right", verticalAlign: "top" }}>
                        {formatRupiah(p.jumlah)}
                      </td>
                    </tr>
                  ))
                )}

                {/* 2. BAGIAN BELANJA */}
                <tr style={{ backgroundColor: "#EFF6FF", borderBottom: "2px solid #BFDBFE", borderTop: "2px solid #CBD5E1" }}>
                  <td style={{ padding: "12px 16px", fontSize: 12, fontWeight: 700, color: "#1E40AF", textAlign: "center" }}>
                    5.x.x
                  </td>
                  <td colSpan={2} style={{ padding: "12px 16px" }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1E40AF", textTransform: "uppercase" }}>BELANJA BLUD</div>
                    <div style={{ fontSize: 11, color: "#1D4ED8", marginTop: 2 }}>{subKegiatanList.length} Sub Kegiatan Terverifikasi</div>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 800, color: "#1E40AF", textAlign: "right" }}>
                    {formatRupiah(data.total_belanja || 0)}
                  </td>
                </tr>

                {subKegiatanList.length === 0 ? (
                  <tr style={{ borderBottom: "1px solid #E2E8F0" }}>
                    <td></td>
                    <td colSpan={3} style={{ padding: "12px 16px", fontSize: 12, color: "#94A3B8", fontStyle: "italic", textAlign: "center" }}>
                      Tidak ada transaksi pengeluaran belanja (Nihil)
                    </td>
                  </tr>
                ) : (
                  subKegiatanList.map((sub, sIdx) => {
                    const isCollapsed = collapsedSub[sub.kd_sub_kegiatan] || false;
                    return (
                      <React.Fragment key={`sub-${sIdx}`}>
                        {/* Sub Kegiatan Header (Baris Induk) */}
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

                        {/* Rincian Rekening Belanja di bawah Sub Kegiatan */}
                        {!isCollapsed &&
                          sub.items.map((b: any, bIdx: number) => (
                            <tr key={`sub-${sIdx}-item-${bIdx}`} style={{ borderBottom: "1px solid #E2E8F0", backgroundColor: "#FFFFFF" }} className="hover:bg-slate-50/50">
                              <td style={{ padding: "10px 16px", fontSize: 11, color: "#64748B", fontFamily: "monospace", textAlign: "center", verticalAlign: "top" }}>
                                {b.kd_rek6}
                              </td>
                              <td style={{ padding: "10px 16px", width: 40, verticalAlign: "top" }}>
                                <div style={{ width: 12, height: 12, borderLeft: "2px solid #CBD5E1", borderBottom: "2px solid #CBD5E1", marginLeft: 12, marginTop: 4 }} />
                              </td>
                              <td style={{ padding: "10px 16px", fontSize: 12, verticalAlign: "top", paddingLeft: 0 }}>
                                <div style={{ fontWeight: 600, color: "#0F172A" }}>{b.nm_rek6}</div>
                                {b.keterangan && <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{b.keterangan}</div>}
                              </td>
                              <td style={{ padding: "10px 16px", fontSize: 12, color: "#2563EB", fontWeight: 700, textAlign: "right", verticalAlign: "top" }}>
                                {formatRupiah(b.jumlah)}
                              </td>
                            </tr>
                          ))}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
              <tfoot>
                <tr style={{ backgroundColor: "#F8FAFC", borderTop: "2px solid #CBD5E1", fontWeight: 800 }}>
                  <td colSpan={3} style={{ padding: "14px 16px", fontSize: 13, color: "#0F172A", textTransform: "uppercase" }}>
                    Total Transaksi Disahkan (Pendapatan + Belanja)
                  </td>
                  <td style={{ padding: "14px 16px", fontSize: 14, color: "#0F172A", textAlign: "right" }}>
                    {formatRupiah((data.total_pendapatan || 0) + (data.total_belanja || 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
