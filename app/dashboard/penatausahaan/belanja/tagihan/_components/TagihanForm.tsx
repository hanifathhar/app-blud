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

interface TagihanFormProps {
  initialData?: any;
  isEdit?: boolean;
}

export default function TagihanForm({ initialData, isEdit = false }: TagihanFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchPenerimaan, setSearchPenerimaan] = useState("");
  const [selectedDetail, setSelectedDetail] = useState<any>(initialData || null);

  const [form, setForm] = useState({
    penerimaan_id: initialData?.penerimaan_barang_id || "",
    permintaan_id: initialData?.permintaan_belanja_id || "",
    no_tagihan: initialData?.no_tagihan || `INV-${Date.now().toString().slice(-6)}`,
    tgl_tagihan: initialData?.tgl_tagihan ? new Date(initialData.tgl_tagihan).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10),
    nm_vendor: initialData?.nm_vendor || "",
    uraian: initialData?.keterangan || "",
    nilai_tagihan: initialData?.nilai_tagihan || 0,
    tahun: initialData?.tahun || new Date().getFullYear().toString(),

    // Display fields
    no_bast: initialData?.penerimaan_barang?.no_bast || "",
    tgl_bast: initialData?.penerimaan_barang?.tgl_bast || "",
  });

  const [penerimaanList, setPenerimaanList] = useState<any[]>([]);
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
      setPenerimaanList([]);
      return;
    }

    let urlPermintaan1 = "/api/penatausahaan/belanja/permintaan?status=draft&jenis_permintaan=non_pengadaan&unused_tagihan=true";
    let urlPermintaan2 = "/api/penatausahaan/belanja/permintaan?status=diterima&jenis_permintaan=pengadaan&unused_tagihan=true";

    if ((user.level === 1 || user.role === "superadmin") && selectedUpt) {
      urlPermintaan1 += `&kd_upt=${selectedUpt}`;
      urlPermintaan2 += `&kd_upt=${selectedUpt}`;
    }

    Promise.all([
      fetch(urlPermintaan1).then(r => r.json()),
      fetch(urlPermintaan2).then(r => r.json())
    ]).then(([d1, d2]) => {
      const data1 = Array.isArray(d1.data || d1) ? (d1.data || d1) : [];
      const data2 = Array.isArray(d2.data || d2) ? (d2.data || d2) : [];

      const combinedData = [...data1, ...data2];

      const mappedPermintaan = combinedData.map((p: any) => ({
        ...p,
        _source_type: "Permintaan",
        _display_no: p.no_permintaan,
        _display_vendor: p.nm_ukm || "",
        _display_uraian: p.keterangan,
        _display_nilai: p.rincian?.reduce((acc: number, r: any) => acc + Number(r.total || 0), 0) || 0,
      }));

      setPenerimaanList(mappedPermintaan);
    });
  }, [user, selectedUpt]);

  const filteredPenerimaan = penerimaanList.filter(p =>
    p._display_no?.toLowerCase().includes(searchPenerimaan.toLowerCase()) ||
    p._display_vendor?.toLowerCase().includes(searchPenerimaan.toLowerCase()) ||
    p._display_uraian?.toLowerCase().includes(searchPenerimaan.toLowerCase())
  );

  const handlePenerimaanChange = (selected: any) => {
    if (!selected) {
      setSelectedDetail(null);
      setForm({
        ...form,
        penerimaan_id: "",
        permintaan_id: "",
        no_bast: "",
        tgl_bast: "",
        nm_vendor: "",
        uraian: "",
        nilai_tagihan: 0,
      });
      return;
    }

    const data = selected.data;
    setSelectedDetail(data);

    if (data._source_type === "Permintaan") {
      setForm({
        ...form,
        penerimaan_id: "",
        permintaan_id: data.id,
        no_bast: data._display_no,
        tgl_bast: data.tgl_permintaan ? new Date(data.tgl_permintaan).toISOString().split("T")[0] : "",
        uraian: data._display_uraian || form.uraian,
        nilai_tagihan: data._display_nilai || 0,
      });
    } else {
      setForm({
        ...form,
        penerimaan_id: data.id,
        permintaan_id: "",
        no_bast: data._display_no,
        tgl_bast: data.tgl_bast ? new Date(data.tgl_bast).toISOString().split("T")[0] : "",
        uraian: data._display_uraian || form.uraian,
        nilai_tagihan: data._display_nilai || 0,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const url = isEdit ? `/api/penatausahaan/belanja/tagihan/${initialData?.id}` : "/api/penatausahaan/belanja/tagihan";
    const method = isEdit ? "PUT" : "POST";

    const payload = { ...form };

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
          text: 'Data Tagihan berhasil disimpan',
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          router.push("/dashboard/penatausahaan/belanja/tagihan");
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

  return (
    <div className="card" style={{ width: "100%", marginBottom: "30px" }}>
      <div className="card-header">
        <span className="card-title">{isEdit ? "Edit Tagihan" : "Tambah Tagihan"}</span>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", padding: "24px", gap: "24px" }}>

        {/* Referensi Penerimaan */}
        <div style={{ backgroundColor: "#F8FAFC", borderRadius: "10px", padding: "20px", border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
            <Search size={18} style={{ color: "#2563EB" }} />
            <span style={{ fontSize: "14px", fontWeight: 700, color: "#1E293B" }}>Pilih Permintaan Belanja (Wajib)</span>
          </div>

          {(user?.level === 1 || user?.role === "superadmin") && !isEdit && (
            <div style={{ marginBottom: "16px" }}>
              <label className="form-label">Pilih UPT</label>
              <Select
                options={upts.map(u => ({ value: u.kd_upt, label: u.nm_upt }))}
                value={selectedUpt ? { value: selectedUpt, label: upts.find(u => u.kd_upt === selectedUpt)?.nm_upt } : null}
                onChange={(s: any) => {
                  setSelectedUpt(s?.value || "");
                  handlePenerimaanChange(null);
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

          <label className="form-label">Nomor BAST</label>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              type="text"
              className="form-input"
              readOnly
              required={!form.permintaan_id} // Either BAST or Permintaan (auto-created)
              value={form.penerimaan_id ? `${form.no_bast} - ${form.nm_vendor}` : form.permintaan_id ? "Tagihan Non-Pengadaan (Otomatis)" : ""}
              placeholder={(user?.level === 1 || user?.role === "superadmin") && !selectedUpt && !isEdit ? "Pilih UPT dulu..." : "-- Belum memilih --"}
              style={{ flex: 1, backgroundColor: "#F1F5F9" }}
            />
            <button
              type="button"
              disabled={isEdit || ((user?.level === 1 || user?.role === "superadmin") && !selectedUpt) || !!form.permintaan_id}
              className="btn-primary"
              onClick={() => setIsDialogOpen(true)}
              style={{ height: "40px", padding: "0 16px" }}
            >
              Cari Data
            </button>
            {form.penerimaan_id && !isEdit && (
              <button
                type="button"
                className="btn-danger"
                onClick={() => handlePenerimaanChange(null)}
                style={{ height: "40px", padding: "0 16px" }}
              >
                Batal Pilih
              </button>
            )}
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent style={{ maxWidth: "800px", width: "95vw", padding: 0, overflow: "hidden", borderRadius: "12px", display: "flex", flexDirection: "column", maxHeight: "85vh", backgroundColor: "#fff" }}>
              <DialogHeader style={{ padding: "16px 24px", borderBottom: "1px solid #E2E8F0", backgroundColor: "#F8FAFC", margin: 0 }}>
                <DialogTitle style={{ fontSize: "18px", fontWeight: 600, color: "#1E293B", margin: 0 }}>Pilih Permintaan Belanja</DialogTitle>
              </DialogHeader>

              <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
                <div style={{ padding: "16px 24px", borderBottom: "1px solid #E2E8F0", backgroundColor: "#fff" }}>
                  <div style={{ position: "relative" }}>
                    <Search size={18} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: "100%", paddingLeft: "36px", backgroundColor: "#F8FAFC" }}
                      placeholder="Cari nomor BAST, vendor, atau uraian..."
                      value={searchPenerimaan}
                      onChange={(e) => setSearchPenerimaan(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: "24px", backgroundColor: "#F8FAFC" }}>
                  {penerimaanList.length === 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 20px", textAlign: "center" }}>
                      <div style={{ width: "64px", height: "64px", backgroundColor: "#F1F5F9", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                        <Info size={32} color="#94A3B8" />
                      </div>
                      <h3 style={{ margin: "0 0 8px 0", color: "#334155", fontWeight: 600 }}>Tidak ada data</h3>
                      <p style={{ margin: 0, color: "#64748B", fontSize: "14px" }}>Tidak ada dokumen BAST yang berstatus "diterima" saat ini.</p>
                    </div>
                  ) : filteredPenerimaan.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748B", fontSize: "14px" }}>
                      <div style={{ width: "64px", height: "64px", backgroundColor: "#F1F5F9", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px auto" }}>
                        <Search size={32} color="#94A3B8" />
                      </div>
                      Pencarian untuk <strong>"{searchPenerimaan}"</strong> tidak ditemukan.
                    </div>
                  ) : (
                    <div style={{ backgroundColor: "#fff", border: "1px solid #E2E8F0", borderRadius: "8px", overflow: "hidden" }}>
                      <div style={{ overflowX: "auto" }}>
                        <table className="table" style={{ width: "100%", fontSize: "14px", margin: 0 }}>
                          <thead>
                            <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "2px solid #E2E8F0" }}>
                              <th style={{ textAlign: "left", padding: "12px 16px", fontSize: "13px", color: "#475569", fontWeight: 600 }}>No. Permintaan</th>
                              <th style={{ textAlign: "left", padding: "12px 16px", fontSize: "13px", color: "#475569", fontWeight: 600 }}>Tanggal Permintaan</th>
                              <th style={{ textAlign: "left", padding: "12px 16px", fontSize: "13px", color: "#475569", fontWeight: 600 }}>uraian</th>
                              <th style={{ textAlign: "right", padding: "12px 16px", fontSize: "13px", color: "#475569", fontWeight: 600 }}>Nilai (Rp)</th>
                              <th style={{ textAlign: "center", padding: "12px 16px", fontSize: "13px", color: "#475569", fontWeight: 600 }}>Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredPenerimaan.map((p: any) => (
                              <tr key={`${p._source_type}-${p.id}`} style={{ borderBottom: "1px solid #F1F5F9" }}>
                                <td style={{ padding: "12px 16px", fontWeight: 500, color: "#334155" }}>
                                  {p._display_no}
                                </td>
                                <td style={{ padding: "12px 16px", color: "#64748B" }}>
                                  {p.tgl_bast ? new Date(p.tgl_bast).toLocaleDateString('id-ID') : p.tgl_permintaan ? new Date(p.tgl_permintaan).toLocaleDateString('id-ID') : "-"}
                                </td>
                                <td style={{ padding: "12px 16px", color: "#475569" }}>{p._display_uraian}</td>
                                <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600 }}>{new Intl.NumberFormat("id-ID").format(p._display_nilai || 0)}</td>
                                <td style={{ textAlign: "center", padding: "12px 16px" }}>
                                  <button
                                    type="button"
                                    className="btn-primary"
                                    style={{ padding: "6px 16px", fontSize: "13px", borderRadius: "6px", margin: 0 }}
                                    onClick={() => {
                                      handlePenerimaanChange({ data: p });
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

        {selectedDetail && (
          <div style={{ backgroundColor: "#F8FAFC", borderRadius: "10px", padding: "20px", border: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <Info size={18} style={{ color: "#2563EB" }} />
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#1E293B" }}>Informasi Rincian Belanja</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "14px" }}>
              <div>
                <div style={{ color: "#64748B", fontSize: "12px", fontWeight: 600 }}>UKM</div>
                <div style={{ color: "#0F172A", fontWeight: 500 }}>{selectedDetail.kd_ukm || "-"} - {selectedDetail.nm_ukm || "-"}</div>
              </div>
              <div>
                <div style={{ color: "#64748B", fontSize: "12px", fontWeight: 600 }}>Peruntukan</div>
                <div style={{ color: "#0F172A", fontWeight: 500 }}>{selectedDetail.kd_peruntukan || "-"} - {selectedDetail.nm_peruntukan || "-"}</div>
              </div>
              <div>
                <div style={{ color: "#64748B", fontSize: "12px", fontWeight: 600 }}>Komponen</div>
                <div style={{ color: "#0F172A", fontWeight: 500 }}>{selectedDetail.kd_komponen || "-"} - {selectedDetail.nm_komponen || "-"}</div>
              </div>
              <div>
                <div style={{ color: "#64748B", fontSize: "12px", fontWeight: 600 }}>Rincian (Tugas Jabatan)</div>
                <div style={{ color: "#0F172A", fontWeight: 500 }}>{selectedDetail.kd_rincian || "-"} - {selectedDetail.nm_rincian || "-"}</div>
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <div style={{ color: "#64748B", fontSize: "12px", fontWeight: 600 }}>Sub Kegiatan</div>
                <div style={{ color: "#0F172A", fontWeight: 500 }}>{selectedDetail.kd_sub_kegiatan || "-"} - {selectedDetail.nm_sub_kegiatan || "-"}</div>
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <div style={{ color: "#64748B", fontSize: "12px", fontWeight: 600 }}>Kode SPM</div>
                <div style={{ color: "#0F172A", fontWeight: 500 }}>{selectedDetail.kd_spm || "-"} - {selectedDetail.nm_spm || "-"}</div>
              </div>

            </div>
          </div>
        )}

        {/* Section 1: Form Utama (Detail Tagihan) */}
        <div style={{ backgroundColor: "#fff", borderRadius: "10px", padding: "20px", border: "1px solid #E2E8F0", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <span style={{ fontSize: "16px", fontWeight: 700, color: "#1E293B" }}>Detail Tagihan (Invoice)</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            <div>
              <label className="form-label">Nomor Tagihan</label>
              <input
                required
                type="text"
                className="form-input"
                value={form.no_tagihan}
                onChange={(e) => setForm({ ...form, no_tagihan: e.target.value })}
                placeholder="Masukkan Nomor Tagihan/Invoice"
              />
            </div>
            <div>
              <label className="form-label">Tanggal Tagihan</label>
              <input
                required
                type="date"
                className="form-input"
                value={form.tgl_tagihan}
                onChange={(e) => setForm({ ...form, tgl_tagihan: e.target.value })}
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
              <label className="form-label">Nama Vendor / Penerima Pembayaran</label>
              <input
                required
                type="text"
                className="form-input"
                value={form.nm_vendor}
                onChange={(e) => setForm({ ...form, nm_vendor: e.target.value })}
                placeholder="Cth: CV Makmur"
              />
            </div>
            <div>
              <label className="form-label">Nilai Tagihan (Rp)</label>
              <input
                required
                type="number"
                className="form-input"
                value={form.nilai_tagihan}
                onChange={(e) => setForm({ ...form, nilai_tagihan: Number(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Uraian Tagihan</label>
            <textarea
              className="form-textarea"
              rows={2}
              required
              value={form.uraian}
              onChange={(e) => setForm({ ...form, uraian: e.target.value })}
              placeholder="Uraian pembayaran tagihan..."
            />
          </div>
        </div>

        {/* Section 3: Rincian Barang/Jasa */}
        {selectedDetail && selectedDetail.rincian && selectedDetail.rincian.length > 0 && (
          <div className="animate-fadein">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1E293B" }}>Rincian Barang/Jasa</h3>
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
                  {selectedDetail.rincian.map((r: any, idx: number) => (
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
                      Rp {new Intl.NumberFormat("id-ID").format(selectedDetail.rincian.reduce((sum: number, r: any) => sum + (Number(r.total) || 0), 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "12px", color: "#64748B", display: "flex", gap: "6px", alignItems: "center" }}>
            <CheckCircle2 size={14} style={{ color: "#10B981" }} />
            Pastikan dokumen fisik Invoice sesuai
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button type="button" onClick={() => router.back()} className="btn btn-ghost">Batal</button>
            <button type="submit" disabled={submitting || (!form.penerimaan_id && !form.permintaan_id)} className="btn btn-primary">
              {submitting ? <span className="loading-spinner" /> : null}
              {submitting ? "Menyimpan..." : "Simpan Tagihan"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
