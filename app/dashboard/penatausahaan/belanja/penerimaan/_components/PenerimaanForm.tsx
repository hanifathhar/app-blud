"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Select from "react-select";
import Swal from "sweetalert2";
import { Info, CheckCircle2, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PenerimaanFormProps {
  initialData?: any;
  isEdit?: boolean;
}

export default function PenerimaanForm({ initialData, isEdit = false }: PenerimaanFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchPengadaan, setSearchPengadaan] = useState("");

  const [form, setForm] = useState({
    pengadaan_id: initialData?.pengadaan_id || "",
    no_bast: initialData?.no_bast || "",
    tgl_bast: initialData?.tgl_bast ? new Date(initialData.tgl_bast).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10),
    nm_vendor: initialData?.nm_vendor || "",
    uraian: initialData?.keterangan || initialData?.uraian || "",
    nilai_bast: initialData?.nilai_bast || 0,
    tahun: initialData?.tahun || new Date().getFullYear().toString(),
    no_kontrak: initialData?.no_kontrak || "",
    tgl_kontrak: initialData?.tgl_kontrak ? new Date(initialData.tgl_kontrak).toISOString().substring(0, 10) : "",
    kd_ukm: initialData?.kd_ukm || "",
    kd_peruntukan: initialData?.kd_peruntukan || "",
    kd_komponen: initialData?.kd_komponen || "",
    kd_rincian: initialData?.kd_rincian || "",
    kd_sub_kegiatan: initialData?.kd_sub_kegiatan || "",
    kd_spm: initialData?.kd_spm || "",
  });

  const [rincian, setRincian] = useState<any[]>(initialData?.rincian || []);
  const [pengadaanList, setPengadaanList] = useState<any[]>([]);
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
      setPengadaanList([]);
      return;
    }

    let url = "/api/penatausahaan/belanja/pengadaan?status=proses";
    if ((user.level === 1 || user.role === "superadmin") && selectedUpt) {
      url += `&kd_upt=${selectedUpt}`;
    }

    fetch(url)
      .then(r => r.json())
      .then(d => {
        // Handle pagination response format
        const data = d.data || d;
        setPengadaanList(Array.isArray(data) ? data : []);
      });
  }, [user, selectedUpt]);

  const filteredPengadaan = pengadaanList.filter(p =>
    p.no_kontrak?.toLowerCase().includes(searchPengadaan.toLowerCase()) ||
    p.nm_vendor?.toLowerCase().includes(searchPengadaan.toLowerCase()) ||
    p.uraian?.toLowerCase().includes(searchPengadaan.toLowerCase())
  );

  const handlePengadaanChange = (selected: any) => {
    if (!selected) {
      setForm({
        ...form,
        pengadaan_id: "",
        no_kontrak: "",
        tgl_kontrak: "",
        nm_vendor: "",
        uraian: "",
        nilai_bast: 0,
        kd_ukm: "",
        kd_peruntukan: "",
        kd_komponen: "",
        kd_rincian: "",
        kd_sub_kegiatan: "",
        kd_spm: ""
      });
      setRincian([]);
      return;
    }

    const data = selected.data;
    setForm({
      ...form,
      pengadaan_id: data.id,
      no_kontrak: data.no_kontrak,
      tgl_kontrak: data.tgl_kontrak,
      nm_vendor: data.nm_vendor,
      uraian: data.uraian || form.uraian,
      nilai_bast: data.nilai_kontrak,
      kd_ukm: data.kd_ukm || "",
      kd_peruntukan: data.kd_peruntukan || "",
      kd_komponen: data.kd_komponen || "",
      kd_rincian: data.kd_rincian || "",
      kd_sub_kegiatan: data.kd_sub_kegiatan || "",
      kd_spm: data.kd_spm || "",
    });

    const mappedRincian = (data.rincian || []).map((r: any) => ({
      ...r,
      id: undefined,
      pengadaan_id: undefined
    }));
    setRincian(mappedRincian);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const url = isEdit ? `/api/penatausahaan/belanja/penerimaan/${initialData?.id}` : "/api/penatausahaan/belanja/penerimaan";
    const method = isEdit ? "PUT" : "POST";

    const payload = {
      ...form,
      rincian
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: 'Data BAST berhasil disimpan',
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          router.push("/dashboard/penatausahaan/belanja/penerimaan");
          router.refresh();
        });
      } else {
        const errorData = await res.json();
        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: errorData.error || errorData.message || "Gagal menyimpan data"
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Terjadi Kesalahan',
        text: 'Tidak dapat menghubungi server'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const totalNilai = rincian.reduce((sum, r) => sum + (Number(r.total) || 0), 0);

  return (
    <div className="card" style={{ width: "100%", marginBottom: "30px" }}>
      <div className="card-header">
        <span className="card-title">Tambah BAST</span>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", padding: "24px", gap: "24px" }}>

        {/* Referensi Pengadaan */}
        <div style={{ backgroundColor: "#F8FAFC", borderRadius: "10px", padding: "20px", border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <Search size={18} style={{ color: "#2563EB" }} />
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#1E293B" }}>Pilih Pengadaan (Wajib)</span>
          </div>

          {(user?.level === 1 || user?.role === "superadmin") && !isEdit && (
            <div style={{ marginBottom: "16px" }}>
              <label className="form-label">Pilih UPT</label>
              <Select
                options={upts.map(u => ({ value: u.kd_upt, label: u.nm_upt }))}
                value={selectedUpt ? { value: selectedUpt, label: upts.find(u => u.kd_upt === selectedUpt)?.nm_upt } : null}
                onChange={(s: any) => {
                  setSelectedUpt(s?.value || "");
                  handlePengadaanChange(null);
                }}
                placeholder="-- Pilih UPT Terlebih Dahulu --"
                isClearable
                menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                styles={{ 
                  control: (base) => ({ ...base, borderColor: '#E2E8F0', borderRadius: '9px', minHeight: '40px' }),
                  menuPortal: (base) => ({ ...base, zIndex: 9999 })
                }}
              />
            </div>
          )}

          <label className="form-label">Nomor Kontrak / SPK</label>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              type="text"
              className="form-input"
              readOnly
              required
              value={form.pengadaan_id ? `${form.no_kontrak} - ${form.nm_vendor}` : ""}
              placeholder={(user?.level === 1 || user?.role === "superadmin") && !selectedUpt && !isEdit ? "Pilih UPT dulu..." : "-- Belum memilih --"}
              style={{ flex: 1, backgroundColor: "#F1F5F9" }}
            />
            <button
              type="button"
              disabled={isEdit || ((user?.level === 1 || user?.role === "superadmin") && !selectedUpt)}
              className="btn-primary"
              onClick={() => setIsDialogOpen(true)}
              style={{ height: "40px", padding: "0 16px" }}
            >
              Cari Data
            </button>
            {form.pengadaan_id && !isEdit && (
              <button
                type="button"
                className="btn-danger"
                onClick={() => handlePengadaanChange(null)}
                style={{ height: "40px", padding: "0 16px" }}
              >
                Batal Pilih
              </button>
            )}
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent style={{ maxWidth: "800px", width: "95vw", padding: 0, overflow: "hidden", borderRadius: "12px", display: "flex", flexDirection: "column", maxHeight: "85vh", backgroundColor: "#fff" }}>
              <DialogHeader style={{ padding: "16px 24px", borderBottom: "1px solid #E2E8F0", backgroundColor: "#F8FAFC", margin: 0 }}>
                <DialogTitle style={{ fontSize: "18px", fontWeight: 600, color: "#1E293B", margin: 0 }}>Pilih SPK/Kontrak</DialogTitle>
              </DialogHeader>

              <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
                <div style={{ padding: "16px 24px", borderBottom: "1px solid #E2E8F0", backgroundColor: "#fff" }}>
                  <div style={{ position: "relative" }}>
                    <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: "100%", paddingLeft: "36px", backgroundColor: "#F8FAFC" }}
                      placeholder="Cari nomor kontrak, vendor, atau uraian..."
                      value={searchPengadaan}
                      onChange={(e) => setSearchPengadaan(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: "24px", backgroundColor: "#F8FAFC" }}>
                  {pengadaanList.length === 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 20px", textAlign: "center" }}>
                      <div style={{ width: "64px", height: "64px", backgroundColor: "#F1F5F9", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                        <Info size={32} color="#94A3B8" />
                      </div>
                      <h3 style={{ margin: "0 0 8px 0", color: "#334155", fontWeight: 600 }}>Tidak ada data</h3>
                      <p style={{ margin: 0, color: "#64748B", fontSize: "14px" }}>Tidak ada pengadaan yang berstatus "proses" saat ini.</p>
                    </div>
                  ) : filteredPengadaan.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748B", fontSize: "14px" }}>
                      <div style={{ width: "64px", height: "64px", backgroundColor: "#F1F5F9", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px auto" }}>
                        <Search size={32} color="#94A3B8" />
                      </div>
                      Pencarian untuk <strong>"{searchPengadaan}"</strong> tidak ditemukan.
                    </div>
                  ) : (
                    <div style={{ backgroundColor: "#fff", border: "1px solid #E2E8F0", borderRadius: "8px", overflow: "hidden" }}>
                      <div style={{ overflowX: "auto" }}>
                        <table className="table" style={{ width: "100%", fontSize: "14px", margin: 0 }}>
                          <thead style={{ backgroundColor: "#F8FAFC" }}>
                            <tr>
                              <th style={{ textAlign: "left", padding: "12px 16px", borderBottom: "1px solid #E2E8F0", color: "#475569", fontWeight: 600 }}>No. Kontrak</th>
                              <th style={{ textAlign: "left", padding: "12px 16px", borderBottom: "1px solid #E2E8F0", color: "#475569", fontWeight: 600 }}>Tgl Kontrak</th>
                              <th style={{ textAlign: "left", padding: "12px 16px", borderBottom: "1px solid #E2E8F0", color: "#475569", fontWeight: 600 }}>Vendor</th>
                              <th style={{ textAlign: "right", padding: "12px 16px", borderBottom: "1px solid #E2E8F0", color: "#475569", fontWeight: 600 }}>Nilai</th>
                              <th style={{ textAlign: "center", padding: "12px 16px", borderBottom: "1px solid #E2E8F0", color: "#475569", fontWeight: 600 }}>Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredPengadaan.map((p: any) => (
                              <tr key={p.id} style={{ borderBottom: "1px solid #F1F5F9" }}>
                                <td style={{ padding: "12px 16px", fontWeight: 500, color: "#334155" }}>{p.no_kontrak}</td>
                                <td style={{ padding: "12px 16px", color: "#64748B" }}>{new Date(p.tgl_kontrak).toLocaleDateString('id-ID')}</td>
                                <td style={{ padding: "12px 16px", color: "#475569" }}>{p.nm_vendor}</td>
                                <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600 }}>{new Intl.NumberFormat("id-ID").format(p.nilai_kontrak || 0)}</td>
                                <td style={{ textAlign: "center", padding: "12px 16px" }}>
                                  <button
                                    type="button"
                                    className="btn-primary"
                                    style={{ padding: "6px 16px", fontSize: "13px", borderRadius: "6px", margin: 0 }}
                                    onClick={() => {
                                      handlePengadaanChange({ data: p });
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

        {form.pengadaan_id && (
          <>
            {/* Section 1: Form Utama (Detail BAST) */}
            <div style={{ backgroundColor: "#fff", borderRadius: "10px", padding: "20px", border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <span style={{ fontSize: "16px", fontWeight: 700, color: "#1E293B" }}>Detail BAST</span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                <div>
                  <label className="form-label">Nomor BAST</label>
                  <input
                    required
                    type="text"
                    className="form-input"
                    value={form.no_bast}
                    onChange={(e) => setForm({ ...form, no_bast: e.target.value })}
                    placeholder="Masukkan Nomor BAST"
                  />
                </div>
                <div>
                  <label className="form-label">Tanggal BAST</label>
                  <input
                    required
                    type="date"
                    className="form-input"
                    value={form.tgl_bast}
                    onChange={(e) => setForm({ ...form, tgl_bast: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Tahun</label>
                  <input
                    required
                    type="text"
                    maxLength={4}
                    className="form-input"
                    value={form.tahun}
                    onChange={(e) => setForm({ ...form, tahun: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label className="form-label">Nama Vendor / Penyedia</label>
                  <input
                    readOnly
                    type="text"
                    className="form-input bg-gray-50"
                    value={form.nm_vendor}
                  />
                </div>
                <div>
                  <label className="form-label">Nilai BAST (Rp)</label>
                  <input
                    readOnly
                    type="text"
                    className="form-input bg-gray-50"
                    value={new Intl.NumberFormat("id-ID").format(form.nilai_bast)}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Uraian BAST</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  required
                  value={form.uraian}
                  onChange={(e) => setForm({ ...form, uraian: e.target.value })}
                  placeholder="Uraian pekerjaan penerimaan..."
                />
              </div>
            </div>

            {/* Section 3: Rincian Barang/Jasa */}
            <div className="animate-fadein">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1E293B" }}>Rincian Pekerjaan dari Pengadaan</h3>
              </div>

              <div className="tbl-wrap">
                <table className="tbl" style={{ minWidth: "900px" }}>
                  <thead>
                    <tr>
                      <th style={{ width: 250 }}>Rekening</th>
                      <th>Uraian Barang/Jasa</th>
                      <th style={{ width: 80, textAlign: "center" }}>Volume</th>
                      <th style={{ width: 100 }}>Satuan</th>
                      <th style={{ width: 150, textAlign: "right" }}>Harga (Rp)</th>
                      <th style={{ width: 150, textAlign: "right" }}>Total (Rp)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rincian.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: "center", color: "#94A3B8", padding: "30px 0" }}>Belum ada rincian ditambahkan</td>
                      </tr>
                    ) : rincian.map((r, idx) => (
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
                      <td colSpan={5} style={{ textAlign: "right" }}>Total Nilai BAST :</td>
                      <td style={{ textAlign: "right", color: "#2563EB", fontSize: "14.5px" }}>Rp {new Intl.NumberFormat("id-ID").format(totalNilai)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "12px", color: "#64748B", display: "flex", gap: "6px", alignItems: "center" }}>
                <CheckCircle2 size={14} style={{ color: "#10B981" }} />
                Pastikan data BAST sesuai dengan dokumen fisik
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <button type="button" onClick={() => router.back()} className="btn btn-ghost">Batal</button>
                <button type="submit" disabled={submitting || rincian.length === 0} className="btn btn-primary">
                  {submitting ? <span className="loading-spinner" /> : null}
                  {submitting ? "Menyimpan..." : "Simpan BAST"}
                </button>
              </div>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
