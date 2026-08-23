"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Select from "react-select";
import Swal from "sweetalert2";
import { Plus, Trash, Info, CheckCircle2, X, Edit } from "lucide-react";
interface PermintaanFormProps {
  initialData?: any;
  isEdit?: boolean;
}

export default function PermintaanForm({ initialData, isEdit = false }: PermintaanFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [form, setForm] = useState({
    no_permintaan: initialData?.no_permintaan || "",
    tgl_permintaan: initialData?.tgl_permintaan ? new Date(initialData.tgl_permintaan).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10),
    kd_upt: initialData?.kd_upt || "",
    nm_upt: initialData?.nm_upt || "",
    
    // Header RBA Fields
    kd_ukm: initialData?.kd_ukm || "",
    nm_ukm: initialData?.nm_ukm || "",
    kd_peruntukan: initialData?.kd_peruntukan || "",
    nm_peruntukan: initialData?.nm_peruntukan || "",
    kd_komponen: initialData?.kd_komponen || "",
    nm_komponen: initialData?.nm_komponen || "",
    kd_rincian: initialData?.kd_rincian || "",
    nm_rincian: initialData?.nm_rincian || "",
    kd_sub_kegiatan: initialData?.kd_sub_kegiatan || "",
    nm_sub_kegiatan: initialData?.nm_sub_kegiatan || "",
    kd_spm: initialData?.kd_spm || "",
    nm_spm: initialData?.nm_spm || "",

    keterangan: initialData?.keterangan || "",
    tahun: initialData?.tahun || new Date().getFullYear().toString(),
  });

  const [rincian, setRincian] = useState<any[]>(initialData?.rincian || []);

  const [showDialog, setShowDialog] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [tempRincian, setTempRincian] = useState<any>({
    kd_rek6: "", nm_rek6: "", uraian: "", volume: 1, satuan: "", harga: 0, total: 0, sumdan: ""
  });
  const [upts, setUpts] = useState<any[]>([]);
  const [rbaHeaders, setRbaHeaders] = useState<any[]>([]);
  const [availableRek6s, setAvailableRek6s] = useState<any[]>([]);

  useEffect(() => {
    if (!isEdit && !form.no_permintaan) {
      const generatedNo = `REQ-${Date.now().toString().slice(-6)}`;
      setForm(prev => ({ ...prev, no_permintaan: generatedNo }));
    }

    fetch("/api/me").then(r => r.json()).then(d => {
      if (d.user) {
        setUser(d.user);
        if (!isEdit && (d.user.role !== "superadmin")) {
          setForm(prev => ({ ...prev, kd_upt: d.user.kd_upt }));
        }
      }
    });

    fetch("/api/master/upt").then(r => r.json()).then(d => setUpts(d.data || []));
  }, [isEdit]);

  useEffect(() => {
    const unit = form.kd_upt || user?.kd_upt || "";
    const tahun = form.tahun || new Date().getFullYear().toString();
    
    if (unit && tahun) {
      fetch(`/api/penatausahaan/belanja/permintaan/rba-options?kd_upt=${unit}&tahun=${tahun}`)
        .then(r => r.json())
        .then(d => {
          setRbaHeaders(d.data || []);
        });
    }
  }, [form.kd_upt, form.tahun, user?.kd_upt]);

  const handleHeaderChange = (selected: any) => {
    if (!selected) {
      setForm({
        ...form,
        kd_ukm: "", nm_ukm: "",
        kd_peruntukan: "", nm_peruntukan: "",
        kd_komponen: "", nm_komponen: "",
        kd_rincian: "", nm_rincian: "",
        kd_sub_kegiatan: "", nm_sub_kegiatan: "",
        kd_spm: "", nm_spm: "",
      });
      setAvailableRek6s([]);
      setRincian([]);
      return;
    }

    const d = selected.data;
    setForm({
      ...form,
      kd_ukm: d.kd_ukm, nm_ukm: d.nm_ukm,
      kd_peruntukan: d.kd_peruntukan, nm_peruntukan: d.nm_peruntukan,
      kd_komponen: d.kd_komponen, nm_komponen: d.nm_komponen,
      kd_rincian: d.kd_rincian, nm_rincian: d.nm_rincian,
      kd_sub_kegiatan: d.kd_sub_kegiatan, nm_sub_kegiatan: d.nm_sub_kegiatan,
      kd_spm: d.kd_spm, nm_spm: d.nm_spm,
    });
    setAvailableRek6s(d.rekenings || []);
    setRincian([]);
  };

  const openAddModal = () => {
    setTempRincian({ kd_rek6: "", nm_rek6: "", uraian: "", volume: 1, satuan: "", harga: 0, total: 0, sumdan: "" });
    setEditIndex(null);
    setShowDialog(true);
  };

  const openEditModal = (idx: number) => {
    setTempRincian({ ...rincian[idx] });
    setEditIndex(idx);
    setShowDialog(true);
  };

  const saveModal = () => {
    if (!tempRincian.kd_rek6 || !tempRincian.uraian || !tempRincian.volume || !tempRincian.satuan || !tempRincian.harga) {
      Swal.fire({ icon: 'warning', title: 'Data belum lengkap', text: 'Mohon lengkapi data rincian.' });
      return;
    }
    const newTotal = Number(tempRincian.volume) * Number(tempRincian.harga);
    const updatedTemp = { ...tempRincian, total: newTotal };
    
    if (editIndex !== null) {
      const newRincian = [...rincian];
      newRincian[editIndex] = updatedTemp;
      setRincian(newRincian);
    } else {
      setRincian([...rincian, updatedTemp]);
    }
    setShowDialog(false);
  };

  const handleRemoveRincian = (index: number) => {
    const newRincian = [...rincian];
    newRincian.splice(index, 1);
    setRincian(newRincian);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    const url = isEdit ? `/api/penatausahaan/belanja/permintaan/${initialData.id}` : "/api/penatausahaan/belanja/permintaan";
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
          text: 'Data berhasil disimpan',
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          router.push("/dashboard/penatausahaan/belanja/permintaan");
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

  // Helper formatting options for the RBA dropdown
  const rbaOptions = rbaHeaders.map((h: any) => ({
    value: `${h.kd_ukm}-${h.kd_peruntukan}-${h.kd_komponen}-${h.kd_rincian}-${h.kd_sub_kegiatan}-${h.kd_spm}`, // unique key
    label: `[${h.kd_sub_kegiatan}] ${h.nm_sub_kegiatan} | Komponen: ${h.nm_komponen}`,
    data: h
  }));

  const selectedHeaderValue = form.kd_sub_kegiatan ? `${form.kd_ukm}-${form.kd_peruntukan}-${form.kd_komponen}-${form.kd_rincian}-${form.kd_sub_kegiatan}-${form.kd_spm}` : null;

  return (
    <div className="card" style={{ width: "100%", marginBottom: "30px" }}>
      <div className="card-header">
        <span className="card-title">{isEdit ? "Edit Permintaan Belanja" : "Tambah Permintaan Belanja"}</span>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", padding: "24px", gap: "24px" }}>
        
        {/* Section 1: Form Utama */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {user?.role === "superadmin" ? (
            <div>
              <label className="form-label">UPT</label>
              <Select
                instanceId="select-upt"
                options={(upts || []).map((u: any) => ({ value: u.kd_upt, label: `${u.kd_upt} - ${u.nm_upt}`, data: u }))}
                value={form.kd_upt ? { value: form.kd_upt, label: `${form.kd_upt} - ${upts.find((u: any) => u.kd_upt === form.kd_upt)?.nm_upt || form.nm_upt}` } : null}
                onChange={(selected: any) => {
                  setForm({ ...form, kd_upt: selected?.value || "", nm_upt: selected?.data?.nm_upt || "" });
                }}
                placeholder="-- Pilih UPT --"
                isClearable
                menuPosition="fixed"
                styles={{ control: (base) => ({ ...base, borderColor: '#e2e8f0', borderRadius: '9px', minHeight: '40px' }) }}
              />
            </div>
          ) : null}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
            <div>
              <label className="form-label">Nomor Permintaan</label>
              <input
                required
                readOnly={!isEdit}
                type="text"
                className="form-input bg-gray-50"
                value={form.no_permintaan}
                onChange={(e) => setForm({ ...form, no_permintaan: e.target.value })}
                placeholder="Otomatis"
              />
            </div>
            <div>
              <label className="form-label">Tanggal Permintaan</label>
              <input
                required
                type="date"
                className="form-input"
                value={form.tgl_permintaan}
                onChange={(e) => setForm({ ...form, tgl_permintaan: e.target.value })}
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
        </div>

        {/* Section 2: Pemilihan Header RBA */}
        <div style={{ backgroundColor: "#F8FAFC", borderRadius: "10px", padding: "20px", border: "1px solid #E2E8F0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
             <Info size={18} style={{ color: "#2563EB" }} />
             <span style={{ fontSize: "14px", fontWeight: 700, color: "#1E293B" }}>Pilih Sub Kegiatan dari RBA Penetapan Aktif</span>
          </div>
          
          <label className="form-label">Kegiatan / Sub Kegiatan</label>
          <Select
            instanceId="select-rba-header"
            options={rbaOptions}
            value={rbaOptions.find(o => o.value === selectedHeaderValue) || null}
            onChange={handleHeaderChange}
            placeholder="-- Cari dan Pilih Sub Kegiatan --"
            isClearable
            menuPosition="fixed"
            styles={{ control: (base) => ({ ...base, borderColor: '#E2E8F0', borderRadius: '9px', minHeight: '40px' }) }}
          />

          {form.kd_sub_kegiatan && (
            <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px", backgroundColor: "#fff", padding: "16px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
              <div><span style={{ color: "#64748B", fontWeight: 600, display: "block", marginBottom: "4px", fontSize: "11px", textTransform: "uppercase" }}>UKM</span> {form.kd_ukm} - {form.nm_ukm}</div>
              <div><span style={{ color: "#64748B", fontWeight: 600, display: "block", marginBottom: "4px", fontSize: "11px", textTransform: "uppercase" }}>Peruntukan</span> {form.kd_peruntukan} - {form.nm_peruntukan}</div>
              <div><span style={{ color: "#64748B", fontWeight: 600, display: "block", marginBottom: "4px", fontSize: "11px", textTransform: "uppercase" }}>Komponen</span> {form.kd_komponen} - {form.nm_komponen}</div>
              <div><span style={{ color: "#64748B", fontWeight: 600, display: "block", marginBottom: "4px", fontSize: "11px", textTransform: "uppercase" }}>Rincian</span> {form.kd_rincian} - {form.nm_rincian}</div>
              <div style={{ gridColumn: "1 / -1" }}><span style={{ color: "#64748B", fontWeight: 600, display: "block", marginBottom: "4px", fontSize: "11px", textTransform: "uppercase" }}>SPM</span> {form.kd_spm} - {form.nm_spm}</div>
            </div>
          )}
        </div>

        <div>
          <label className="form-label">Keterangan / Tujuan Permintaan</label>
          <textarea
            className="form-textarea"
            rows={2}
            required
            value={form.keterangan}
            onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
            placeholder="Ketik keterangan atau tujuan permintaan di sini..."
          />
        </div>

        {/* Section 3: Rincian Barang/Jasa */}
        {form.kd_sub_kegiatan && (
          <div className="animate-fadein">
             <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
               <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1E293B" }}>Rincian Barang/Jasa</h3>
               <button type="button" onClick={openAddModal} className="btn btn-outline btn-sm">
                 <Plus size={14} /> Tambah Rincian
               </button>
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
                     <th style={{ width: 80, textAlign: "center" }}>Aksi</th>
                   </tr>
                 </thead>
                 <tbody>
                   {rincian.length === 0 ? (
                     <tr>
                       <td colSpan={7} style={{ textAlign: "center", color: "#94A3B8", padding: "30px 0" }}>Belum ada rincian ditambahkan</td>
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
                       <td style={{ verticalAlign: "top", paddingTop: "12px", textAlign: "center" }}>
                         <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                           <button type="button" onClick={() => openEditModal(idx)} style={{ color: "#3B82F6", background: "none", border: "none", cursor: "pointer" }}>
                             <Edit size={16} />
                           </button>
                           <button type="button" onClick={() => handleRemoveRincian(idx)} style={{ color: "#F43F5E", background: "none", border: "none", cursor: "pointer" }}>
                             <Trash size={16} />
                           </button>
                         </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
                 <tfoot>
                   <tr className="tbl-total">
                     <td colSpan={5} style={{ textAlign: "right" }}>Total Seluruhnya :</td>
                     <td style={{ textAlign: "right", color: "#2563EB", fontSize: "14.5px" }}>Rp {new Intl.NumberFormat("id-ID").format(totalNilai)}</td>
                     <td></td>
                   </tr>
                 </tfoot>
               </table>
             </div>
          </div>
        )}

        <div style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "12px", color: "#64748B", display: "flex", gap: "6px", alignItems: "center" }}>
            <CheckCircle2 size={14} style={{ color: "#10B981" }} />
            Pastikan data yang diisi sudah sesuai dengan RBA Penetapan
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button type="button" onClick={() => router.back()} className="btn btn-ghost">Batal</button>
            <button type="submit" disabled={submitting || !form.kd_sub_kegiatan} className="btn btn-primary">
              {submitting ? <span className="loading-spinner" /> : null}
              {submitting ? "Menyimpan..." : "Simpan Permintaan"}
            </button>
          </div>
        </div>
      </form>

      {/* Modal Dialog for Rincian */}
      {showDialog && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowDialog(false)}>
          <div className="modal" style={{ maxWidth: "600px", zIndex: 1050 }}>
            <div className="modal-header">
              <h3 style={{ fontSize: "16px", fontWeight: 700, margin: 0 }}>{editIndex !== null ? "Edit Rincian" : "Tambah Rincian"}</h3>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowDialog(false)} style={{ padding: "4px" }}><X size={18} /></button>
            </div>
            
            <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label className="form-label">Rekening Belanja</label>
                <Select
                  instanceId="select-modal-rek"
                  options={availableRek6s.map((rek: any) => ({ value: rek.kd_rek6, label: `${rek.kd_rek6} - ${rek.nm_rek6}`, data: rek }))}
                  value={tempRincian.kd_rek6 ? { value: tempRincian.kd_rek6, label: `${tempRincian.kd_rek6} - ${tempRincian.nm_rek6}` } : null}
                  onChange={(selected: any) => {
                    setTempRincian({
                      ...tempRincian,
                      kd_rek6: selected?.value || "",
                      nm_rek6: selected?.data?.nm_rek6 || "",
                      sumdan: selected?.data?.sumdan || ""
                    });
                  }}
                  placeholder="Pilih Rekening RBA"
                  menuPortalTarget={typeof window !== "undefined" ? document.body : null}
                  styles={{ 
                    control: (base) => ({ ...base, minHeight: '40px', borderRadius: '9px', borderColor: '#E2E8F0' }),
                    menuPortal: base => ({ ...base, zIndex: 9999 })
                  }}
                />
                {(() => {
                  const selectedRek = availableRek6s.find(rek => rek.kd_rek6 === tempRincian.kd_rek6);
                  if (selectedRek && selectedRek.pagu !== undefined) {
                    return (
                      <div style={{ fontSize: "12px", color: "#10B981", marginTop: "8px", fontWeight: 600, display: "flex", alignItems: "center", gap: "4px" }}>
                        <Info size={14} /> Sisa Anggaran: Rp {new Intl.NumberFormat("id-ID").format(selectedRek.pagu)}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              <div>
                <label className="form-label">Uraian Barang/Jasa</label>
                <input type="text" className="form-input" value={tempRincian.uraian} onChange={(e) => setTempRincian({ ...tempRincian, uraian: e.target.value })} placeholder="Masukkan uraian" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <label className="form-label">Volume</label>
                  <input type="number" min="1" step="0.01" className="form-input" value={tempRincian.volume} onChange={(e) => setTempRincian({ ...tempRincian, volume: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Satuan</label>
                  <input type="text" className="form-input" value={tempRincian.satuan} onChange={(e) => setTempRincian({ ...tempRincian, satuan: e.target.value })} placeholder="Rim/Pcs/dll" />
                </div>
              </div>

              <div>
                <label className="form-label">Harga Satuan (Rp)</label>
                <input type="number" min="0" step="0.01" className="form-input" value={tempRincian.harga} onChange={(e) => setTempRincian({ ...tempRincian, harga: e.target.value })} />
              </div>

              <div style={{ padding: "16px", backgroundColor: "#F8FAFC", borderRadius: "8px", border: "1px solid #E2E8F0", marginTop: "8px" }}>
                <div style={{ fontSize: "12px", color: "#64748B", marginBottom: "4px" }}>Total Harga</div>
                <div style={{ fontSize: "18px", fontWeight: 700, color: "#1E293B" }}>
                  Rp {new Intl.NumberFormat("id-ID").format((Number(tempRincian.volume) || 0) * (Number(tempRincian.harga) || 0))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setShowDialog(false)}>Batal</button>
              <button type="button" className="btn btn-primary" onClick={saveModal}>Simpan Rincian</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
