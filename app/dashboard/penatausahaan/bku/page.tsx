"use client";

import { useState, useEffect } from "react";
import { Plus, Download } from "lucide-react";

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
  bulan: number | null;
  tahun: number | null;
}
interface UserInfo { role: string; kd_upt: string | null; }

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
  const [summary, setSummary] = useState({ totalDebet: 0, totalKredit: 0, saldoAkhir: 0 });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const now = new Date();
  const [bulan, setBulan] = useState(now.getMonth() + 1);
  const [tahun, setTahun] = useState(now.getFullYear());

  useEffect(() => {
    const t = localStorage.getItem("tahunName");
    if (t) setTahun(parseInt(t));
  }, []);

  const [form, setForm] = useState({
    no_bukti: "", tgl_transaksi: "", uraian: "",
    debet: "", kredit: "", kd_rek6: "", jenis: "kas", tagihan_id: "",
  });
  const [tagihanList, setTagihanList] = useState<any[]>([]);

  useEffect(() => {
    if (showForm && user) {
      fetch(`/api/penatausahaan/belanja/tagihan?limit=100&kd_upt=${user.kd_upt || ""}`)
        .then(r => r.json())
        .then(d => {
          if (d.data) {
            setTagihanList(d.data.filter((t: any) => t.status === "belum_dibayar"));
          }
        });
    }
  }, [showForm, user]);

  const handleSelectTagihan = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    if (!id) {
      setForm({ ...form, tagihan_id: "", uraian: "", kredit: "", kd_rek6: "" });
      return;
    }
    const tag = tagihanList.find(t => t.id.toString() === id);
    if (tag) {
      setForm({
        ...form,
        tagihan_id: id,
        uraian: `Pembayaran Tagihan ${tag.no_tagihan} - ${tag.nm_vendor || tag.keterangan || ""}`,
        kredit: tag.nilai_tagihan?.toString() || "",
        debet: "0",
        kd_rek6: tag.kd_rek6 || "",
        jenis: "bank",
        tgl_transaksi: new Date().toISOString().split("T")[0]
      });
    }
  };

  const loadData = () => {
    setLoading(true);
    fetch(`/api/penatausahaan/bku?bulan=${bulan}&tahun=${tahun}`)
      .then((r) => r.json())
      .then((d) => {
        setList(d.data || []);
        setSummary({ totalDebet: d.totalDebet || 0, totalKredit: d.totalKredit || 0, saldoAkhir: d.saldoAkhir || 0 });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((d) => d.user && setUser(d.user));
  }, []);
  useEffect(() => { if (user) loadData(); }, [user, bulan, tahun]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/penatausahaan/bku", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        debet: form.debet ? parseFloat(form.debet) : 0,
        kredit: form.kredit ? parseFloat(form.kredit) : 0,
      }),
    });
    if (res.ok) {
      setShowForm(false);
      setForm({ no_bukti: "", tgl_transaksi: "", uraian: "", debet: "", kredit: "", kd_rek6: "", jenis: "kas", tagihan_id: "" });
      loadData();
    }
    setSubmitting(false);
  };

  const canCreate = user && ["superadmin", "bendahara"].includes(user.role);

  return (
    <div className="animate-fadein">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>📖 Buku Kas Umum (BKU)</h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>
            Pencatatan kas masuk dan keluar — {BULAN_NAMA[bulan]} {tahun}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <select className="form-select" style={{ width: 130 }} value={bulan} onChange={(e) => setBulan(parseInt(e.target.value))}>
            {BULAN_NAMA.slice(1).map((nm, i) => <option key={i + 1} value={i + 1}>{nm}</option>)}
          </select>
          <div style={{ background: "#F1F5F9", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700, color: "#475569", border: "1px solid #E2E8F0", display: "flex", alignItems: "center" }}>
            TA {tahun}
          </div>
          {canCreate && (
            <button className="btn btn-primary" onClick={() => setShowForm(true)}>
              <Plus size={16} /> Input Transaksi
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
        <div className="stat-card" style={{ padding: 16, borderLeft: "4px solid #10B981" }}>
          <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Total Penerimaan (Debet)</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#10B981" }}>{formatRupiah(summary.totalDebet)}</div>
        </div>
        <div className="stat-card" style={{ padding: 16, borderLeft: "4px solid #F43F5E" }}>
          <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Total Pengeluaran (Kredit)</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#F43F5E" }}>{formatRupiah(summary.totalKredit)}</div>
        </div>
        <div className="stat-card" style={{ padding: 16, borderLeft: "4px solid #2563EB" }}>
          <div style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Saldo Akhir</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: summary.saldoAkhir >= 0 ? "#2563EB" : "#F43F5E" }}>
            {formatRupiah(summary.saldoAkhir)}
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowForm(false)}>
          <div className="modal">
            <div className="modal-header">
              <span style={{ fontSize: 16, fontWeight: 700 }}>📖 Input Transaksi BKU</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body" style={{ display: "grid", gap: 14 }}>
                {tagihanList.length > 0 && (
                  <div>
                    <label className="form-label" style={{ color: "#2563EB", fontWeight: 600 }}>Ambil dari Tagihan (Opsional)</label>
                    <select className="form-select" value={form.tagihan_id} onChange={handleSelectTagihan} style={{ borderColor: "#BFDBFE", backgroundColor: "#EFF6FF" }}>
                      <option value="">-- Pilih Tagihan Belum Dibayar --</option>
                      {tagihanList.map(t => (
                        <option key={t.id} value={t.id}>{t.no_tagihan} - {formatRupiah(t.nilai_tagihan || 0)} - {t.nm_vendor || t.keterangan}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label className="form-label">No. Bukti</label>
                    <input className="form-input" value={form.no_bukti} onChange={(e) => setForm({ ...form, no_bukti: e.target.value })} placeholder="BKT-001" />
                  </div>
                  <div>
                    <label className="form-label">Tanggal *</label>
                    <input className="form-input" type="date" required value={form.tgl_transaksi} onChange={(e) => setForm({ ...form, tgl_transaksi: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="form-label">Uraian Transaksi *</label>
                  <textarea className="form-textarea" required value={form.uraian} onChange={(e) => setForm({ ...form, uraian: e.target.value })} rows={2} placeholder="Uraian transaksi..." />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label className="form-label">Debet / Penerimaan (Rp)</label>
                    <input
                      className="form-input"
                      type="number"
                      value={form.debet}
                      onChange={(e) => setForm({ ...form, debet: e.target.value, kredit: "" })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="form-label">Kredit / Pengeluaran (Rp)</label>
                    <input
                      className="form-input"
                      type="number"
                      value={form.kredit}
                      onChange={(e) => setForm({ ...form, kredit: e.target.value, debet: "" })}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label className="form-label">Kode Rekening</label>
                    <input className="form-input" value={form.kd_rek6} onChange={(e) => setForm({ ...form, kd_rek6: e.target.value })} placeholder="x.xx.xx.xx.xx" />
                  </div>
                  <div>
                    <label className="form-label">Jenis Kas</label>
                    <select className="form-select" value={form.jenis} onChange={(e) => setForm({ ...form, jenis: e.target.value })}>
                      <option value="kas">Kas Tunai</option>
                      <option value="bank">Kas Bank</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <span className="loading-spinner" /> : <Plus size={15} />}
                  {submitting ? "Menyimpan..." : "Simpan Transaksi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BKU Table — Buku style */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">📖 Buku Kas Umum — {BULAN_NAMA[bulan]} {tahun}</span>
          <span style={{ fontSize: 12, color: "#94A3B8" }}>{list.length} transaksi</span>
        </div>
        {loading ? (
          <div className="empty-state" style={{ padding: 48 }}><div className="loading-spinner" /></div>
        ) : list.length === 0 ? (
          <div className="empty-state" style={{ padding: 48 }}>
            <div className="empty-state-icon">📖</div>
            <p style={{ fontWeight: 600 }}>Belum ada transaksi {BULAN_NAMA[bulan]} {tahun}</p>
          </div>
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
                {list.map((row, i) => (
                  <tr key={row.id}>
                    <td style={{ fontSize: 11, color: "#94A3B8" }}>{i + 1}</td>
                    <td style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                      {row.tgl_transaksi ? new Date(row.tgl_transaksi).toLocaleDateString("id-ID", { day: "2-digit", month: "short" }) : "-"}
                    </td>
                    <td style={{ fontSize: 12, fontWeight: 600, color: "#2563EB" }}>{row.no_bukti || "-"}</td>
                    <td style={{ maxWidth: 240, fontSize: 12.5 }}>{row.uraian || "-"}</td>
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
                ))}
              </tbody>
              <tfoot>
                <tr className="tbl-total">
                  <td colSpan={6} style={{ textAlign: "right", fontWeight: 700, fontSize: 13 }}>TOTAL</td>
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
