"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Select from "react-select";
import Swal from "sweetalert2";
import { Info, CheckCircle2, Search, Receipt } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function formatRupiah(val: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
}

export default function PengeluaranForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTagihan, setSearchTagihan] = useState("");
  const [selectedTagihan, setSelectedTagihan] = useState<any>(null);

  const [form, setForm] = useState({
    tagihan_id: "",
    tgl_pengeluaran: new Date().toISOString().split("T")[0],
    keterangan: "",
  });

  const [tagihanList, setTagihanList] = useState<any[]>([]);
  const [upts, setUpts] = useState<any[]>([]);
  const [selectedUpt, setSelectedUpt] = useState("");

  useEffect(() => {
    fetch("/api/me").then(r => r.json()).then(d => {
      if (d.user) setUser(d.user);
    });
    fetch("/api/upt").then(r => r.json()).then(d => setUpts(d.data || []));
  }, []);

  useEffect(() => {
    if (!user) return;

    if ((user.level === 1 || user.role === "superadmin") && !selectedUpt) {
      setTagihanList([]);
      return;
    }

    let url = "/api/penatausahaan/belanja/tagihan/unbooked";
    if ((user.level === 1 || user.role === "superadmin") && selectedUpt) {
      url += `?kd_upt=${selectedUpt}`;
    }

    fetch(url).then(r => r.json()).then(d => {
      setTagihanList(d.data || []);
    });
  }, [user, selectedUpt]);

  const filteredTagihan = tagihanList.filter(t =>
    t.no_tagihan?.toLowerCase().includes(searchTagihan.toLowerCase()) ||
    t.nm_vendor?.toLowerCase().includes(searchTagihan.toLowerCase()) ||
    t.keterangan?.toLowerCase().includes(searchTagihan.toLowerCase())
  );

  const handleTagihanSelect = (tagihan: any | null) => {
    if (!tagihan) {
      setSelectedTagihan(null);
      setForm(prev => ({ ...prev, tagihan_id: "", keterangan: "" }));
      return;
    }
    setSelectedTagihan(tagihan);
    setForm(prev => ({
      ...prev,
      tagihan_id: tagihan.id,
      keterangan: tagihan.keterangan || "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tagihan_id || !form.tgl_pengeluaran) {
      Swal.fire("Error", "Pilih Tagihan dan Tanggal Pengeluaran", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/penatausahaan/belanja/pengeluaran", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        Swal.fire({
          icon: "success",
          title: "Berhasil",
          text: "Tagihan berhasil dibukukan sebagai Pengeluaran",
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
          text: errorData.error || errorData.message || "Gagal menyimpan data",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Terjadi Kesalahan",
        text: "Tidak dapat menghubungi server",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="card" style={{ width: "100%", marginBottom: "30px" }}>
      <div className="card-header">
        <span className="card-title">Bukukan Tagihan menjadi Pengeluaran</span>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", padding: "24px", gap: "24px" }}>

        {/* Pilih Tagihan */}
        <div style={{ backgroundColor: "#F8FAFC", borderRadius: "10px", padding: "20px", border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <Search size={18} style={{ color: "#2563EB" }} />
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#1E293B" }}>Pilih Tagihan (Wajib)</span>
          </div>

          {/* Filter UPT (superadmin only) */}
          {(user?.level === 1 || user?.role === "superadmin") && (
            <div style={{ marginBottom: "16px" }}>
              <label className="form-label">Pilih UPT</label>
              <Select
                options={upts.map(u => ({ value: u.kd_upt, label: u.nm_upt }))}
                value={selectedUpt ? { value: selectedUpt, label: upts.find(u => u.kd_upt === selectedUpt)?.nm_upt } : null}
                onChange={(s: any) => {
                  setSelectedUpt(s?.value || "");
                  handleTagihanSelect(null);
                }}
                placeholder="-- Pilih UPT Terlebih Dahulu --"
                isClearable
                menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                styles={{
                  control: (base) => ({ ...base, borderColor: "#E2E8F0", borderRadius: "9px", minHeight: "40px" }),
                  menuPortal: (base) => ({ ...base, zIndex: 9999 }),
                }}
              />
            </div>
          )}

          <label className="form-label">Nomor Tagihan</label>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              type="text"
              className="form-input"
              readOnly
              required
              value={selectedTagihan ? `${selectedTagihan.no_tagihan} - ${selectedTagihan.nm_vendor || ""}` : ""}
              placeholder={
                (user?.level === 1 || user?.role === "superadmin") && !selectedUpt
                  ? "Pilih UPT dulu..."
                  : "-- Belum memilih tagihan --"
              }
              style={{ flex: 1, backgroundColor: "#F1F5F9" }}
            />
            <button
              type="button"
              disabled={(user?.level === 1 || user?.role === "superadmin") && !selectedUpt}
              className="btn-primary"
              onClick={() => setIsDialogOpen(true)}
              style={{ height: "40px", padding: "0 16px" }}
            >
              Cari Data
            </button>
            {selectedTagihan && (
              <button
                type="button"
                className="btn-danger"
                onClick={() => handleTagihanSelect(null)}
                style={{ height: "40px", padding: "0 16px" }}
              >
                Batal Pilih
              </button>
            )}
          </div>

          {/* Dialog Pilih Tagihan */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent style={{ maxWidth: "800px", width: "95vw", padding: 0, overflow: "hidden", borderRadius: "12px", display: "flex", flexDirection: "column", maxHeight: "85vh", backgroundColor: "#fff" }}>
              <DialogHeader style={{ padding: "16px 24px", borderBottom: "1px solid #E2E8F0", backgroundColor: "#F8FAFC", margin: 0 }}>
                <DialogTitle style={{ fontSize: "18px", fontWeight: 600, color: "#1E293B", margin: 0 }}>Pilih Tagihan Belum Dibayar</DialogTitle>
              </DialogHeader>

              <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
                <div style={{ padding: "16px 24px", borderBottom: "1px solid #E2E8F0", backgroundColor: "#fff" }}>
                  <div style={{ position: "relative" }}>
                    <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: "100%", paddingLeft: "36px", backgroundColor: "#F8FAFC" }}
                      placeholder="Cari nomor tagihan, vendor, atau keterangan..."
                      value={searchTagihan}
                      onChange={(e) => setSearchTagihan(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: "24px", backgroundColor: "#F8FAFC" }}>
                  {tagihanList.length === 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 20px", textAlign: "center" }}>
                      <div style={{ width: "64px", height: "64px", backgroundColor: "#F1F5F9", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                        <Info size={32} color="#94A3B8" />
                      </div>
                      <h3 style={{ margin: "0 0 8px 0", color: "#334155", fontWeight: 600 }}>Tidak ada data</h3>
                      <p style={{ margin: 0, color: "#64748B", fontSize: "14px" }}>Tidak ada tagihan yang belum dibukukan saat ini.</p>
                    </div>
                  ) : filteredTagihan.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748B", fontSize: "14px" }}>
                      <div style={{ width: "64px", height: "64px", backgroundColor: "#F1F5F9", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px auto" }}>
                        <Search size={32} color="#94A3B8" />
                      </div>
                      Pencarian untuk <strong>"{searchTagihan}"</strong> tidak ditemukan.
                    </div>
                  ) : (
                    <div style={{ backgroundColor: "#fff", border: "1px solid #E2E8F0", borderRadius: "8px", overflow: "hidden" }}>
                      <div style={{ overflowX: "auto" }}>
                        <table className="table" style={{ width: "100%", fontSize: "14px", margin: 0 }}>
                          <thead>
                            <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "2px solid #E2E8F0" }}>
                              <th style={{ textAlign: "left", padding: "12px 16px", fontSize: "13px", color: "#475569", fontWeight: 600 }}>No. Tagihan</th>
                              <th style={{ textAlign: "left", padding: "12px 16px", fontSize: "13px", color: "#475569", fontWeight: 600 }}>Tanggal</th>
                              <th style={{ textAlign: "left", padding: "12px 16px", fontSize: "13px", color: "#475569", fontWeight: 600 }}>Vendor</th>
                              <th style={{ textAlign: "left", padding: "12px 16px", fontSize: "13px", color: "#475569", fontWeight: 600 }}>Keterangan</th>
                              <th style={{ textAlign: "right", padding: "12px 16px", fontSize: "13px", color: "#475569", fontWeight: 600 }}>Nilai (Rp)</th>
                              <th style={{ textAlign: "center", padding: "12px 16px", fontSize: "13px", color: "#475569", fontWeight: 600 }}>Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredTagihan.map((t: any) => (
                              <tr key={t.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                                <td style={{ padding: "12px 16px", fontWeight: 500, color: "#334155" }}>{t.no_tagihan}</td>
                                <td style={{ padding: "12px 16px", color: "#64748B" }}>
                                  {t.tgl_tagihan ? new Date(t.tgl_tagihan).toLocaleDateString("id-ID") : "-"}
                                </td>
                                <td style={{ padding: "12px 16px", color: "#475569" }}>{t.nm_vendor || "-"}</td>
                                <td style={{ padding: "12px 16px", color: "#475569" }}>{t.keterangan || "-"}</td>
                                <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600 }}>
                                  {new Intl.NumberFormat("id-ID").format(t.nilai_tagihan || 0)}
                                </td>
                                <td style={{ textAlign: "center", padding: "12px 16px" }}>
                                  <button
                                    type="button"
                                    className="btn-primary"
                                    style={{ padding: "6px 16px", fontSize: "13px", borderRadius: "6px", margin: 0 }}
                                    onClick={() => {
                                      handleTagihanSelect(t);
                                      setIsDialogOpen(false);
                                    }}
                                  >
                                    Pilih
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Info Tagihan Terpilih */}
        {selectedTagihan && (
          <div style={{ backgroundColor: "#F8FAFC", borderRadius: "10px", padding: "20px", border: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <Receipt size={18} style={{ color: "#2563EB" }} />
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#1E293B" }}>Informasi Tagihan Terpilih</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "14px" }}>
              <div>
                <div style={{ color: "#64748B", fontSize: "12px", fontWeight: 600 }}>No. Tagihan</div>
                <div style={{ color: "#0F172A", fontWeight: 500 }}>{selectedTagihan.no_tagihan || "-"}</div>
              </div>
              <div>
                <div style={{ color: "#64748B", fontSize: "12px", fontWeight: 600 }}>Tanggal Tagihan</div>
                <div style={{ color: "#0F172A", fontWeight: 500 }}>
                  {selectedTagihan.tgl_tagihan ? new Date(selectedTagihan.tgl_tagihan).toLocaleDateString("id-ID") : "-"}
                </div>
              </div>
              <div>
                <div style={{ color: "#64748B", fontSize: "12px", fontWeight: 600 }}>Vendor / Penerima</div>
                <div style={{ color: "#0F172A", fontWeight: 500 }}>{selectedTagihan.nm_vendor || "-"}</div>
              </div>
              <div>
                <div style={{ color: "#64748B", fontSize: "12px", fontWeight: 600 }}>Nilai Tagihan</div>
                <div style={{ color: "#2563EB", fontWeight: 700, fontSize: "15px" }}>{formatRupiah(selectedTagihan.nilai_tagihan || 0)}</div>
              </div>
              <div>
                <div style={{ color: "#64748B", fontSize: "12px", fontWeight: 600 }}>UKM</div>
                <div style={{ color: "#0F172A", fontWeight: 500 }}>{selectedTagihan.kd_ukm || "-"} - {selectedTagihan.nm_ukm || "-"}</div>
              </div>
              <div>
                <div style={{ color: "#64748B", fontSize: "12px", fontWeight: 600 }}>Peruntukan</div>
                <div style={{ color: "#0F172A", fontWeight: 500 }}>{selectedTagihan.kd_peruntukan || "-"} - {selectedTagihan.nm_peruntukan || "-"}</div>
              </div>
              <div>
                <div style={{ color: "#64748B", fontSize: "12px", fontWeight: 600 }}>Komponen</div>
                <div style={{ color: "#0F172A", fontWeight: 500 }}>{selectedTagihan.kd_komponen || "-"} - {selectedTagihan.nm_komponen || "-"}</div>
              </div>
              <div>
                <div style={{ color: "#64748B", fontSize: "12px", fontWeight: 600 }}>Rincian (Tugas Jabatan)</div>
                <div style={{ color: "#0F172A", fontWeight: 500 }}>{selectedTagihan.kd_rincian || "-"} - {selectedTagihan.nm_rincian || "-"}</div>
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <div style={{ color: "#64748B", fontSize: "12px", fontWeight: 600 }}>Sub Kegiatan</div>
                <div style={{ color: "#0F172A", fontWeight: 500 }}>{selectedTagihan.kd_sub_kegiatan || "-"} - {selectedTagihan.nm_sub_kegiatan || "-"}</div>
              </div>
            </div>

            {/* Rincian Barang/Jasa */}
            {selectedTagihan.rincian && selectedTagihan.rincian.length > 0 && (
              <div style={{ marginTop: "20px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 700, color: "#1E293B", marginBottom: "12px" }}>Rincian Barang/Jasa</h3>
                <div className="tbl-wrap">
                  <table className="tbl" style={{ minWidth: "700px" }}>
                    <thead>
                      <tr>
                        <th style={{ width: 220 }}>Rekening</th>
                        <th>Uraian Barang/Jasa</th>
                        <th style={{ width: 70, textAlign: "center" }}>Volume</th>
                        <th style={{ width: 90 }}>Satuan</th>
                        <th style={{ width: 130, textAlign: "right" }}>Harga (Rp)</th>
                        <th style={{ width: 130, textAlign: "right" }}>Total (Rp)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTagihan.rincian.map((r: any, idx: number) => (
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
                          Rp {new Intl.NumberFormat("id-ID").format(selectedTagihan.rincian.reduce((sum: number, r: any) => sum + (Number(r.total) || 0), 0))}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Detail Pengeluaran */}
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
                value={selectedTagihan ? formatRupiah(selectedTagihan.nilai_tagihan || 0) : "-"}
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
              placeholder="Keterangan tambahan (opsional)..."
            />
          </div>
        </div>

        <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "12px", color: "#64748B", display: "flex", gap: "6px", alignItems: "center" }}>
            <CheckCircle2 size={14} style={{ color: "#10B981" }} />
            Pastikan tagihan sudah diverifikasi sebelum dibukukan
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button type="button" onClick={() => router.back()} className="btn btn-ghost">Batal</button>
            <button type="submit" disabled={submitting || !form.tagihan_id} className="btn btn-primary">
              {submitting ? <span className="loading-spinner" /> : null}
              {submitting ? "Menyimpan..." : "Bukukan Pengeluaran"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
