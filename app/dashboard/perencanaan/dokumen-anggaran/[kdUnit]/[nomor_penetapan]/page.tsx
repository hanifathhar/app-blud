"use client";

import React, { useState, useEffect, use } from "react";
import { ArrowLeft, Building, Calendar, FileText, ChevronDown, ChevronRight, Printer } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DokumenAnggaranDetailPage({ params }: { params: Promise<{ kdUnit: string, nomor_penetapan: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const kdUnit = resolvedParams.kdUnit;
  const nomor_penetapan = decodeURIComponent(resolvedParams.nomor_penetapan);

  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<any>(null);
  const [collapsedRows, setCollapsedRows] = useState<Record<number, boolean>>({});

  const toggleRow = (idx: number) => {
    setCollapsedRows(prev => {
      const isCurrentlyCollapsed = prev[idx] !== undefined ? prev[idx] : true;
      return {
        ...prev,
        [idx]: !isCurrentlyCollapsed
      };
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Kita bisa buat API khusus atau menggunakan API GET penetapan-rba yang difilter
      const res = await fetch(`/api/perencanaan/penetapan-rba/detail?kdUnit=${kdUnit}&nomor_penetapan=${encodeURIComponent(nomor_penetapan)}`);
      if (res.ok) {
        const d = await res.json();
        if (d.data && d.data.length > 0) {
          setInfo(d.data[0]); // Ambil info metadata dari row pertama

          // Grouping berdasarkan kdSubKegiatan
          const grouped: Record<string, any> = {};
          d.data.forEach((item: any) => {
            const key = item.kdSubKegiatan || '0.00.00.0.00.00';
            if (!grouped[key]) {
              grouped[key] = {
                ...item,
                sumdanList: item.sumdan ? [item.sumdan] : [],
                noRbaList: item.no_rba ? [item.no_rba] : [],
                nilai: Number(item.nilai) || 0,
                rincian: item.rincian ? [...item.rincian] : []
              };
            } else {
              if (item.sumdan && !grouped[key].sumdanList.includes(item.sumdan)) {
                grouped[key].sumdanList.push(item.sumdan);
              }
              if (item.no_rba && !grouped[key].noRbaList.includes(item.no_rba)) {
                grouped[key].noRbaList.push(item.no_rba);
              }
              grouped[key].nilai += (Number(item.nilai) || 0);
              if (item.rincian) {
                grouped[key].rincian = grouped[key].rincian.concat(item.rincian);
              }
            }
          });

          // Ubah array jadi list string dan urutkan
          const groupedList = Object.values(grouped).map(g => ({
            ...g,
            sumdan: g.sumdanList.join(', '),
            no_rba: g.noRbaList.join(', ')
          }));

          setList(groupedList);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const totalPendapatan = list.filter(x => x.nmSubKegiatan?.toUpperCase() === 'PENDAPATAN').reduce((sum, item) => sum + (Number(item.nilai) || 0), 0);
  const totalBelanja = list.filter(x => x.nmSubKegiatan?.toUpperCase() !== 'PENDAPATAN').reduce((sum, item) => sum + (Number(item.nilai) || 0), 0);

  return (
    <div className="animate-fadein relative">
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <button
          onClick={() => router.push("/dashboard/perencanaan/dokumen-anggaran")}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 8, border: "1px solid #E2E8F0", backgroundColor: "#fff", cursor: "pointer" }}
        >
          <ArrowLeft size={18} color="#475569" />
        </button>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A", display: "flex", alignItems: "center", gap: 8 }}>
            Detail Dokumen Anggaran
            {info?.is_aktif && <span style={{ backgroundColor: "#DCFCE7", color: "#166534", padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, marginLeft: 8 }}>Aktif</span>}
          </h1>
          <div style={{ fontSize: 14, color: "#64748B", marginTop: 4 }}>Nomor: {nomor_penetapan}</div>
        </div>
      </div>

      <div style={{ position: "absolute", top: 0, right: 0, display: "flex", gap: 8 }}>
        <button
          onClick={() => router.push(`/dashboard/perencanaan/dokumen-anggaran/${kdUnit}/${encodeURIComponent(nomor_penetapan)}/cetak?jenis=rka_spm`)}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 8, backgroundColor: "#3B82F6", color: "#fff", fontWeight: 600, border: "none", cursor: "pointer", fontSize: 14 }}
        >
          <Printer size={16} />
          Rekapitulasi Per SPM
        </button>
        <button
          onClick={() => router.push(`/dashboard/perencanaan/dokumen-anggaran/${kdUnit}/${encodeURIComponent(nomor_penetapan)}/cetak?jenis=ringkasan`)}
          style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 8, backgroundColor: "#10B981", color: "#fff", fontWeight: 600, border: "none", cursor: "pointer", fontSize: 14 }}
        >
          <Printer size={16} />
          Cetak Ringkasan RKA
        </button>
      </div>

      {info && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
          <div className="card" style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>
              <Building size={14} /> Unit Kerja (UPT)
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>{info.nmUnit}</div>
          </div>
          <div className="card" style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>
              <Calendar size={14} /> Tgl. Penetapan
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>
              {info.tanggal_penetapan ? new Date(info.tanggal_penetapan).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}
            </div>
          </div>
          <div className="card" style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748B", fontWeight: 600, textTransform: "uppercase" }}>
              <FileText size={14} /> Keterangan
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>{info.keterangan || "-"}</div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="card-title">Struktur Hirarki RBA</span>
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase" }}>Total Pendapatan</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#10B981" }}>Rp {new Intl.NumberFormat('id-ID').format(totalPendapatan)}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#64748B", textTransform: "uppercase" }}>Total Belanja</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#EF4444" }}>Rp {new Intl.NumberFormat('id-ID').format(totalBelanja)}</div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="empty-state" style={{ padding: 48 }}><div className="loading-spinner" /></div>
        ) : list.length === 0 ? (
          <div className="empty-state" style={{ padding: 48, fontSize: 13, color: "#64748B" }}>Tidak ada rincian RBA.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", borderTop: "1px solid #E2E8F0" }}>
              <thead style={{ backgroundColor: "#F8FAFC" }}>
                <tr>
                  <th style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#1E293B", textTransform: "uppercase", textAlign: "center", width: 60, borderBottom: "1px solid #E2E8F0" }}>KODE</th>
                  <th colSpan={2} style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#1E293B", textTransform: "uppercase", textAlign: "left", borderBottom: "1px solid #E2E8F0" }}>URAIAN SUB KEGIATAN / RINCIAN</th>
                  <th style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: "#1E293B", textTransform: "uppercase", textAlign: "right", width: 220, borderBottom: "1px solid #E2E8F0" }}>JUMLAH (RP)</th>
                </tr>
              </thead>
              <tbody>
                {list.map((rbaHeader, rbaIdx) => {
                  const isCollapsed = collapsedRows[rbaIdx] !== undefined ? collapsedRows[rbaIdx] : true;
                  return (
                    <React.Fragment key={rbaIdx}>
                      {/* Header Sub Kegiatan (Baris Induk) */}
                      <tr
                        onClick={() => toggleRow(rbaIdx)}
                        style={{ backgroundColor: "#F1F5F9", borderBottom: "2px solid #CBD5E1", cursor: "pointer" }}
                        className="hover:bg-slate-200/50 transition-colors"
                      >
                        <td style={{ padding: "12px 16px", fontSize: 12, fontWeight: 700, color: "#0F172A", textAlign: "center", verticalAlign: "top" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                            {isCollapsed ? <ChevronRight size={16} color="#64748B" /> : <ChevronDown size={16} color="#64748B" />}
                            {rbaHeader.kdSubKegiatan}
                          </div>
                        </td>
                        <td colSpan={2} style={{ padding: "12px 16px", verticalAlign: "top" }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", textTransform: "uppercase" }}>{rbaHeader.nmSubKegiatan}</div>
                          <div style={{ fontSize: 11, color: "#64748B", marginTop: 4, fontWeight: 600 }}>
                            SUMBER DANA: <span style={{ color: "#3B82F6" }}>{rbaHeader.sumdan || "-"}</span>
                          </div>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 800, color: "#0F172A", textAlign: "right", verticalAlign: "top" }}>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                            <span>{new Intl.NumberFormat('id-ID').format(rbaHeader.nilai || 0)}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/dashboard/perencanaan/dokumen-anggaran/${kdUnit}/${encodeURIComponent(nomor_penetapan)}/cetak?jenis=rka&kdSubKegiatan=${encodeURIComponent(rbaHeader.kdSubKegiatan || '')}`);
                              }}
                              style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 8px", borderRadius: 6, backgroundColor: "#F8FAFC", color: "#475569", border: "1px solid #CBD5E1", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                              className="hover:bg-slate-200 transition-colors"
                            >
                              <Printer size={12} /> Cetak RKA
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Baris Rincian Belanja (Baris Anak) */}
                      {!isCollapsed && (
                        rbaHeader.rincian && rbaHeader.rincian.length > 0 ? (
                          (() => {
                            const groupedRek6 = rbaHeader.rincian.reduce((acc: any, curr: any) => {
                              if (!acc[curr.kd_rek6]) {
                                acc[curr.kd_rek6] = { nama: curr.nm_rek6, items: [], total: 0 };
                              }
                              acc[curr.kd_rek6].items.push(curr);
                              acc[curr.kd_rek6].total += Number(curr.total || curr.nilai || 0);
                              return acc;
                            }, {});

                            return Object.keys(groupedRek6).sort().map((kd6: string) => {
                              const g6 = groupedRek6[kd6];
                              return (
                                <React.Fragment key={`${rbaIdx}-g6-${kd6}`}>
                                  {/* Header Rekening 6 */}
                                  <tr style={{ borderBottom: "1px solid #E2E8F0", backgroundColor: "#F8FAFC" }}>
                                    <td style={{ padding: "10px 16px", fontSize: 11, color: "#334155", fontWeight: 600, textAlign: "center", verticalAlign: "top" }}>
                                      {kd6}
                                    </td>
                                    <td colSpan={2} style={{ padding: "10px 16px", verticalAlign: "top" }}>
                                      <div style={{ fontSize: 12, fontWeight: 600, color: "#334155" }}>{g6.nama}</div>
                                    </td>
                                    <td style={{ padding: "10px 16px", fontSize: 12, color: "#334155", fontWeight: 700, textAlign: "right", verticalAlign: "top" }}>
                                      {new Intl.NumberFormat('id-ID').format(g6.total)}
                                    </td>
                                  </tr>
                                  {/* Detail Item Rekening 6 */}
                                  {g6.items.map((rin: any, rinIdx: number) => (
                                    <tr key={`${rbaIdx}-${kd6}-${rinIdx}`} style={{ borderBottom: "1px solid #E2E8F0", backgroundColor: "#FFFFFF" }} className="hover:bg-slate-50/50">
                                      <td style={{ padding: "12px 16px" }}></td>
                                      <td style={{ padding: "12px 16px", width: 40, verticalAlign: "top" }}>
                                        <div style={{ width: 12, height: 12, borderLeft: "2px solid #CBD5E1", borderBottom: "2px solid #CBD5E1", marginLeft: 12, marginTop: 4 }}></div>
                                      </td>
                                      <td style={{ padding: "12px 16px", fontSize: 12, verticalAlign: "top", paddingLeft: 0 }}>
                                        <div style={{ color: "#475569" }}>{rin.uraian || "-"}</div>
                                        <div style={{ fontSize: 11, color: "#64748B", marginTop: 4, display: "flex", alignItems: "center", gap: 12 }}>
                                          <span>Volume: <b>{Number(rin.volume)} {rin.satuan}</b></span>
                                          <span style={{ color: "#CBD5E1" }}>|</span>
                                          <span>Harga Satuan: <b>Rp {new Intl.NumberFormat('id-ID').format(rin.nilai || 0)}</b></span>
                                        </div>
                                      </td>
                                      <td style={{ padding: "12px 16px", fontSize: 12, color: "#0F172A", fontWeight: 600, textAlign: "right", verticalAlign: "top" }}>
                                        {new Intl.NumberFormat('id-ID').format(rin.total || rin.nilai || 0)}
                                      </td>
                                    </tr>
                                  ))}
                                </React.Fragment>
                              );
                            });
                          })()
                        ) : (
                          <tr style={{ borderBottom: "1px solid #E2E8F0", backgroundColor: "#FFFFFF" }}>
                            <td></td>
                            <td colSpan={3} style={{ padding: "12px 16px", fontSize: 12, color: "#94A3B8", fontStyle: "italic", textAlign: "center" }}>
                              Belum ada rincian belanja.
                            </td>
                          </tr>
                        )
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
