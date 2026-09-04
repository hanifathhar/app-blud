"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Swal from "sweetalert2";
import { CheckCircle2, Receipt, Info } from "lucide-react";

function formatRupiah(val: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
}

export default function EditPengeluaranPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pengeluaran, setPengeluaran] = useState<any>(null);

  const [form, setForm] = useState({
    tgl_pengeluaran: "",
    keterangan: "",
  });

  useEffect(() => {
    if (!id) return;
    fetch(`/api/penatausahaan/belanja/pengeluaran/${id}`)
      .then((r) => r.json())
      .then((d) => {
        const data = d.data;
        if (data) {
          setPengeluaran(data);
          setForm({
            tgl_pengeluaran: data.tgl_pengeluaran
              ? new Date(data.tgl_pengeluaran).toISOString().split("T")[0]
              : "",
            keterangan: data.keterangan || "",
          });
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/penatausahaan/belanja/pengeluaran/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: "Data Pengeluaran berhasil diupdate",
          timer: 1500,
          showConfirmButton: false,
        }).then(() => {
          router.push("/dashboard/penatausahaan/belanja/pengeluaran");
          router.refresh();
        });
      } else {
        const errorData = await res.json();
        Swal.fire({
          icon: "error",
          title: "Gagal",
          text: errorData.error || "Gagal menyimpan data",
        });
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Terjadi Kesalahan", text: "Tidak dapat menghubungi server" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "60px" }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!pengeluaran) {
    return (
      <div style={{ textAlign: "center", padding: "60px", color: "#64748B" }}>
        Data pengeluaran tidak ditemukan.
      </div>
    );
  }

  return (
    <div className="animate-fadein">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>✏️ Edit Pengeluaran</h1>
        <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>
          Ubah data pengeluaran — <strong>{pengeluaran.no_pengeluaran}</strong>
        </p>
      </div>

      <div className="card" style={{ width: "100%", marginBottom: "30px" }}>
        <div className="card-header">
          <span className="card-title">Edit Pengeluaran</span>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", padding: "24px", gap: "24px" }}>

          {/* Info Tagihan Referensi */}
          <div style={{ backgroundColor: "#F8FAFC", borderRadius: "10px", padding: "20px", border: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <Receipt size={18} style={{ color: "#2563EB" }} />
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#1E293B" }}>Informasi Tagihan Terkait</span>
              <span style={{ fontSize: "12px", color: "#64748B", marginLeft: "auto", backgroundColor: "#F1F5F9", padding: "2px 10px", borderRadius: "20px" }}>
                Tidak dapat diubah
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "14px" }}>
              <div>
                <div style={{ color: "#64748B", fontSize: "12px", fontWeight: 600 }}>No. Pengeluaran</div>
                <div style={{ color: "#0F172A", fontWeight: 600 }}>{pengeluaran.no_pengeluaran || "-"}</div>
              </div>
              <div>
                <div style={{ color: "#64748B", fontSize: "12px", fontWeight: 600 }}>No. Tagihan Referensi</div>
                <div style={{ color: "#0F172A", fontWeight: 500 }}>{pengeluaran.tagihan?.no_tagihan || "-"}</div>
              </div>
              <div>
                <div style={{ color: "#64748B", fontSize: "12px", fontWeight: 600 }}>Vendor / Penerima</div>
                <div style={{ color: "#0F172A", fontWeight: 500 }}>{pengeluaran.nm_vendor || "-"}</div>
              </div>
              <div>
                <div style={{ color: "#64748B", fontSize: "12px", fontWeight: 600 }}>Nilai Pengeluaran</div>
                <div style={{ color: "#2563EB", fontWeight: 700, fontSize: "15px" }}>
                  {formatRupiah(pengeluaran.nilai_pengeluaran || 0)}
                </div>
              </div>
              <div>
                <div style={{ color: "#64748B", fontSize: "12px", fontWeight: 600 }}>UKM</div>
                <div style={{ color: "#0F172A", fontWeight: 500 }}>{pengeluaran.kd_ukm || "-"} - {pengeluaran.nm_ukm || "-"}</div>
              </div>
              <div>
                <div style={{ color: "#64748B", fontSize: "12px", fontWeight: 600 }}>Sub Kegiatan</div>
                <div style={{ color: "#0F172A", fontWeight: 500 }}>{pengeluaran.kd_sub_kegiatan || "-"} - {pengeluaran.nm_sub_kegiatan || "-"}</div>
              </div>
            </div>

            {/* Rincian */}
            {pengeluaran.rincian && pengeluaran.rincian.length > 0 && (
              <div style={{ marginTop: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                  <Info size={14} style={{ color: "#2563EB" }} />
                  <h3 style={{ fontSize: "13px", fontWeight: 700, color: "#1E293B" }}>Rincian Barang/Jasa</h3>
                </div>
                <div className="tbl-wrap">
                  <table className="tbl" style={{ minWidth: "700px" }}>
                    <thead>
                      <tr>
                        <th style={{ width: 220 }}>Rekening</th>
                        <th>Uraian</th>
                        <th style={{ width: 70, textAlign: "center" }}>Volume</th>
                        <th style={{ width: 90 }}>Satuan</th>
                        <th style={{ width: 130, textAlign: "right" }}>Harga (Rp)</th>
                        <th style={{ width: 130, textAlign: "right" }}>Total (Rp)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pengeluaran.rincian.map((r: any, idx: number) => (
                        <tr key={idx}>
                          <td style={{ verticalAlign: "top", paddingTop: "12px" }}>
                            <div style={{ fontWeight: 600 }}>{r.kd_rek6}</div>
                            <div style={{ fontSize: "12px", color: "#64748B" }}>{r.nm_rek6}</div>
                          </td>
                          <td style={{ verticalAlign: "top", paddingTop: "12px" }}>{r.uraian}</td>
                          <td style={{ verticalAlign: "top", paddingTop: "12px", textAlign: "center" }}>{r.volume}</td>
                          <td style={{ verticalAlign: "top", paddingTop: "12px" }}>{r.satuan}</td>
                          <td style={{ verticalAlign: "top", paddingTop: "12px", textAlign: "right" }}>{new Intl.NumberFormat("id-ID").format(r.harga || 0)}</td>
                          <td style={{ verticalAlign: "top", paddingTop: "12px", textAlign: "right", fontWeight: 600 }}>{new Intl.NumberFormat("id-ID").format(r.total || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="tbl-total">
                        <td colSpan={5} style={{ textAlign: "right" }}>Total Seluruhnya :</td>
                        <td style={{ textAlign: "right", color: "#2563EB", fontSize: "14.5px" }}>
                          Rp {new Intl.NumberFormat("id-ID").format(
                            pengeluaran.rincian.reduce((sum: number, r: any) => sum + (Number(r.total) || 0), 0)
                          )}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Field yang bisa diedit */}
          <div style={{ backgroundColor: "#fff", borderRadius: "10px", padding: "20px", border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
              <span style={{ fontSize: "16px", fontWeight: 700, color: "#1E293B" }}>Detail Pengeluaran</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <label className="form-label">Tanggal Pengeluaran <span style={{ color: "#EF4444" }}>*</span></label>
                <input
                  required
                  type="date"
                  className="form-input"
                  value={form.tgl_pengeluaran}
                  onChange={(e) => setForm({ ...form, tgl_pengeluaran: e.target.value })}
                />
              </div>
              <div>
                <label className="form-label">Nilai Pengeluaran (Rp)</label>
                <input
                  type="text"
                  className="form-input"
                  readOnly
                  value={formatRupiah(pengeluaran.nilai_pengeluaran || 0)}
                  style={{ backgroundColor: "#F1F5F9", color: "#2563EB", fontWeight: 700 }}
                />
              </div>
            </div>

            <div>
              <label className="form-label">Keterangan</label>
              <textarea
                className="form-textarea"
                rows={3}
                value={form.keterangan}
                onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                placeholder="Keterangan tambahan..."
              />
            </div>
          </div>

          <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "12px", color: "#64748B", display: "flex", gap: "6px", alignItems: "center" }}>
              <CheckCircle2 size={14} style={{ color: "#10B981" }} />
              Hanya tanggal dan keterangan yang dapat diubah
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button type="button" onClick={() => router.back()} className="btn btn-ghost">Batal</button>
              <button type="submit" disabled={submitting} className="btn btn-primary">
                {submitting ? <span className="loading-spinner" /> : null}
                {submitting ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
