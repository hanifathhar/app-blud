"use client";

import { useState, useEffect } from "react";
import { Printer, RefreshCw, Zap } from "lucide-react";
import Select from "react-select";
import Swal from "sweetalert2";

interface BKURow {
  id: number;
  no_bukti: string | null;
  tgl_transaksi: string | null;
  uraian: string | null;
  debet: number | null;
  kredit: number | null;
  saldo: number;
  jenis: string | null;
  kd_rek6: string | null;
  nm_rek6?: string | null;
  bulan: number | null;
  tahun: number | null;
}
interface UserInfo { role: string; kd_upt: string | null; unit?: string; level?: number; }

const BULAN_NAMA = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

function formatRupiah(val: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
}

function formatRupiahNoSymbol(val: number) {
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 0 }).format(val);
}

export default function BKUPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [list, setList] = useState<BKURow[]>([]);
  const [summary, setSummary] = useState({ saldoAwal: 0, totalDebet: 0, totalKredit: 0, saldoAkhir: 0 });
  const [loading, setLoading] = useState(true);
  const [postingLoading, setPostingLoading] = useState(false);
  const [upts, setUpts] = useState<any[]>([]);
  const [filterUpt, setFilterUpt] = useState("");

  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());

  useEffect(() => {
    const t = localStorage.getItem("tahunName");
    if (t) setTahun(parseInt(t));
    fetch("/api/upt").then((r) => r.json()).then((d) => setUpts(d.data || []));
  }, []);

  const loadData = () => {
    setLoading(true);
    const activeUpt = (user?.role === "superadmin" || user?.level === 1) ? filterUpt : (user?.kd_upt || user?.unit || "");
    fetch(`/api/penatausahaan/bku?bulan=${bulan}&tahun=${tahun}&kd_upt=${activeUpt}`)
      .then((r) => r.json())
      .then((d) => {
        setList(d.data || []);
        setSummary({
          saldoAwal: d.saldoAwal || 0,
          totalDebet: d.totalDebet || 0,
          totalKredit: d.totalKredit || 0,
          saldoAkhir: d.saldoAkhir || 0,
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((d) => d.user && setUser(d.user));
  }, []);

  useEffect(() => {
    if (user) loadData();
  }, [user, bulan, tahun, filterUpt]);

  const handlePostingBku = async () => {
    const activeUpt = (user?.role === "superadmin" || user?.level === 1) ? filterUpt : (user?.kd_upt || user?.unit || "");
    if ((user?.role === "superadmin" || user?.level === 1) && !activeUpt) {
      Swal.fire("Pilih UPT", "Silakan pilih unit UPT terlebih dahulu sebelum melakukan posting BKU", "warning");
      return;
    }

    const confirm = await Swal.fire({
      title: "Posting BKU Bulanan?",
      html: `Sistem akan mengambil seluruh data <b>Pendapatan / Penerimaan</b> dan <b>Pengeluaran</b> pada bulan <b>${BULAN_NAMA[bulan]} ${tahun}</b> untuk diposting ke Buku Kas Umum.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#2563EB",
      cancelButtonColor: "#64748B",
      confirmButtonText: "Ya, Posting Sekarang",
      cancelButtonText: "Batal",
    });

    if (!confirm.isConfirmed) return;

    setPostingLoading(true);
    try {
      const res = await fetch("/api/penatausahaan/bku/posting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bulan,
          tahun,
          kd_upt: activeUpt,
        }),
      });

      const result = await res.json();
      if (res.ok) {
        Swal.fire("Berhasil", result.message || "Posting BKU berhasil dilakukan", "success");
        loadData();
      } else {
        Swal.fire("Gagal", result.error || "Gagal melakukan posting BKU", "error");
      }
    } catch (err: any) {
      Swal.fire("Error", "Terjadi kesalahan jaringan saat posting BKU", "error");
    } finally {
      setPostingLoading(false);
    }
  };

  const handleCetakBku = () => {
    const activeUpt = (user?.role === "superadmin" || user?.level === 1) ? filterUpt : (user?.kd_upt || user?.unit || "");
    if ((user?.role === "superadmin" || user?.level === 1) && !activeUpt) {
      Swal.fire("Pilih UPT", "Silakan pilih unit UPT terlebih dahulu untuk mencetak BKU", "warning");
      return;
    }
    window.open(`/dashboard/penatausahaan/bku/cetak?bulan=${bulan}&tahun=${tahun}&kd_upt=${activeUpt}`, "_blank");
  };

  const canCreate = user && ["superadmin", "bendahara", "keuangan", "kpa"].includes(user.role);
  const isSuperAdmin = user?.role === "superadmin" || user?.level === 1;

  return (
    <div className="animate-fadein">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>📖 Buku Kas Umum (BKU)</h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>
            Pencatatan kas masuk dan keluar — {BULAN_NAMA[bulan]} {tahun}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          {isSuperAdmin && (
            <div style={{ minWidth: 260 }}>
              <Select
                options={upts.map((u) => ({ value: u.kd_upt || "", label: `${u.kd_upt ? `[${u.kd_upt}] ` : ""}${u.nm_upt}` }))}
                value={filterUpt ? { value: filterUpt, label: upts.find((u) => u.kd_upt === filterUpt)?.nm_upt || filterUpt } : null}
                onChange={(selected: any) => setFilterUpt(selected?.value || "")}
                placeholder="-- Pilih Unit UPT --"
                isClearable
                menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                styles={{
                  control: (base) => ({ ...base, borderColor: "#CBD5E1", borderRadius: "0.375rem", minHeight: "38px", fontSize: "13px" }),
                  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                }}
              />
            </div>
          )}
          <select className="form-select" style={{ width: 130, height: "38px" }} value={bulan} onChange={(e) => setBulan(parseInt(e.target.value))}>
            {BULAN_NAMA.slice(1).map((nm, i) => <option key={i + 1} value={i + 1}>{nm}</option>)}
          </select>
          <div style={{ background: "#F1F5F9", padding: "8px 14px", borderRadius: 6, fontSize: 13, fontWeight: 700, color: "#475569", border: "1px solid #E2E8F0", display: "flex", alignItems: "center", height: "38px" }}>
            TA {tahun}
          </div>
          {canCreate && (
            <button
              className="btn btn-outline"
              onClick={handlePostingBku}
              disabled={postingLoading}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#2563EB", borderColor: "#BFDBFE", backgroundColor: "#EFF6FF", height: "38px" }}
              title="Tarik data pendapatan dan pengeluaran bulan ini ke BKU"
            >
              {postingLoading ? <RefreshCw size={15} className="animate-spin" /> : <Zap size={15} />}
              {postingLoading ? "Memposting..." : "Posting BKU"}
            </button>
          )}
          <button
            className="btn btn-outline"
            onClick={handleCetakBku}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, height: "38px" }}
            title="Cetak Buku Kas Umum Pengeluaran"
          >
            <Printer size={15} /> Cetak BKU
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        <div className="stat-card" style={{ padding: 16, borderLeft: "4px solid #6366F1" }}>
          <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Saldo Awal (Bulan Lalu)</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: summary.saldoAwal >= 0 ? "#6366F1" : "#F43F5E" }}>
            {formatRupiah(summary.saldoAwal)}
          </div>
        </div>
        <div className="stat-card" style={{ padding: 16, borderLeft: "4px solid #10B981" }}>
          <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Total Penerimaan (Debet)</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#10B981" }}>{formatRupiah(summary.totalDebet)}</div>
        </div>
        <div className="stat-card" style={{ padding: 16, borderLeft: "4px solid #F43F5E" }}>
          <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Total Pengeluaran (Kredit)</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#F43F5E" }}>{formatRupiah(summary.totalKredit)}</div>
        </div>
        <div className="stat-card" style={{ padding: 16, borderLeft: "4px solid #2563EB" }}>
          <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Saldo Akhir (Kumulatif)</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: summary.saldoAkhir >= 0 ? "#2563EB" : "#F43F5E" }}>
            {formatRupiah(summary.saldoAkhir)}
          </div>
        </div>
      </div>

      {/* BKU Table — Buku style */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">📖 Buku Kas Umum — {BULAN_NAMA[bulan]} {tahun}</span>
          <span style={{ fontSize: 12, color: "#94A3B8" }}>{list.length} transaksi</span>
        </div>
        {loading ? (
          <div className="empty-state" style={{ padding: 48 }}><div className="loading-spinner" /></div>
        ) : (
          <div className="tbl-wrap" style={{ borderRadius: 0 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>No</th>
                  <th>Tgl</th>
                  <th>No. Bukti</th>
                  <th>Uraian</th>
                  <th>Rek.</th>
                  <th>Jenis</th>
                  <th style={{ textAlign: "right", color: "#10B981" }}>Debet</th>
                  <th style={{ textAlign: "right", color: "#F43F5E" }}>Kredit</th>
                  <th style={{ textAlign: "right" }}>Saldo</th>
                </tr>
              </thead>
              <tbody>
                {/* Baris Saldo Awal Bulan Lalu */}
                <tr style={{ backgroundColor: "#F8FAFC" }}>
                  <td style={{ textAlign: "center", fontSize: 11, color: "#94A3B8" }}>-</td>
                  <td style={{ fontSize: 12, color: "#64748B" }}>-</td>
                  <td style={{ fontSize: 12, color: "#64748B" }}>-</td>
                  <td style={{ fontWeight: 700, color: "#1E293B" }}>SALDO BULAN LALU</td>
                  <td style={{ fontSize: 11, color: "#94A3B8" }}>-</td>
                  <td>
                    <span className="badge badge-draft" style={{ fontSize: 10.5 }}>Saldo Awal</span>
                  </td>
                  <td style={{ textAlign: "right", color: "#94A3B8" }}>-</td>
                  <td style={{ textAlign: "right", color: "#94A3B8" }}>-</td>
                  <td style={{ textAlign: "right", fontWeight: 700, color: summary.saldoAwal >= 0 ? "#6366F1" : "#F43F5E" }}>
                    {formatRupiahNoSymbol(summary.saldoAwal)}
                  </td>
                </tr>

                {list.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: "center", padding: "24px 0", color: "#94A3B8" }}>
                      Belum ada transaksi di bulan {BULAN_NAMA[bulan]} {tahun}
                    </td>
                  </tr>
                ) : (
                  list.map((row, i) => (
                    <tr key={row.id}>
                      <td style={{ fontSize: 11, color: "#94A3B8" }}>{i + 1}</td>
                      <td style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                        {row.tgl_transaksi ? new Date(row.tgl_transaksi).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }) : "-"}
                      </td>
                      <td style={{ fontSize: 12, fontWeight: 600, color: "#2563EB" }}>{row.no_bukti || "-"}</td>
                      <td style={{ maxWidth: 300, fontSize: 12.5 }}>
                        <div>{row.uraian || "-"}</div>
                        {row.nm_rek6 && (
                          <div style={{ fontSize: 11, color: "#64748B", marginTop: 2, fontStyle: "italic" }}>
                            {row.kd_rek6 ? `${row.kd_rek6} - ` : ""}{row.nm_rek6}
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: 11, color: "#94A3B8" }}>{row.kd_rek6 || "-"}</td>
                      <td>
                        <span className={`badge ${row.jenis === "bank" ? "badge-diajukan" : "badge-draft"}`} style={{ fontSize: 10.5 }}>
                          {row.jenis || "kas"}
                        </span>
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600, color: "#10B981" }}>
                        {row.debet && row.debet > 0 ? formatRupiahNoSymbol(row.debet) : "-"}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 600, color: "#F43F5E" }}>
                        {row.kredit && row.kredit > 0 ? formatRupiahNoSymbol(row.kredit) : "-"}
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: row.saldo >= 0 ? "#2563EB" : "#F43F5E" }}>
                        {formatRupiahNoSymbol(row.saldo)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="tbl-total">
                  <td colSpan={6} style={{ textAlign: "right", fontWeight: 700, fontSize: 13 }}>JUMLAH / SALDO AKHIR</td>
                  <td style={{ textAlign: "right", fontWeight: 800, color: "#10B981" }}>{formatRupiahNoSymbol(summary.totalDebet)}</td>
                  <td style={{ textAlign: "right", fontWeight: 800, color: "#F43F5E" }}>{formatRupiahNoSymbol(summary.totalKredit)}</td>
                  <td style={{ textAlign: "right", fontWeight: 800, color: "#2563EB" }}>{formatRupiahNoSymbol(summary.saldoAkhir)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
