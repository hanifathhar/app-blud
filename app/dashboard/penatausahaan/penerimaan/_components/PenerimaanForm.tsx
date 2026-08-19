"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Select from "react-select";
import Swal from "sweetalert2";

interface PenerimaanFormProps {
  initialData?: any;
  isEdit?: boolean;
}

export default function PenerimaanForm({ initialData, isEdit = false }: PenerimaanFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [form, setForm] = useState({
    noBukti: initialData?.noBukti || "",
    tglBukti: initialData?.tglBukti ? new Date(initialData.tglBukti).toISOString().substring(0, 10) : "",
    kdUnit: initialData?.kdUnit || "",
    nmUnit: initialData?.nmUnit || "",
    kdSubKegiatan: initialData?.kdSubKegiatan || "",
    nmSubKegiatan: initialData?.nmSubKegiatan || "",
    kdRek6: initialData?.kdRek6 || "",
    nmRek6: initialData?.nmRek6 || "",
    nilai: initialData?.nilai?.toString() || "",
    keterangan: initialData?.keterangan || "",
    nmPenyetor: initialData?.nmPenyetor || "",
    sumdan: initialData?.sumdan || "",
    tahun: initialData?.tahun || new Date().getFullYear().toString(),
  });

  const [upts, setUpts] = useState<any[]>([]);
  const [subKegiatans, setSubKegiatans] = useState<any[]>([]);
  const [rek6s, setRek6s] = useState<any[]>([]);
  const [sumdans, setSumdans] = useState<any[]>([]);

  useEffect(() => {
    if (!isEdit && !form.noBukti) {
      const generatedNo = `PNP-${Date.now().toString().slice(-6)}`;
      setForm(prev => ({ ...prev, noBukti: generatedNo }));
    }

    fetch("/api/me").then(r => r.json()).then(d => {
      if (d.user) {
        setUser(d.user);
        if (!isEdit && (d.user.role !== "superadmin")) {
          setForm(prev => ({ ...prev, kdUnit: d.user.kd_upt }));
        }
      }
    });

    fetch("/api/master/upt").then(r => r.json()).then(d => setUpts(d.data || []));
    fetch("/api/master/sub-kegiatan?q=pendapatan&limit=50").then(r => r.json()).then(d => {
      const pendapatan = d.data || [];
      setSubKegiatans(pendapatan);
      if (!isEdit && pendapatan.length > 0 && !form.kdSubKegiatan) {
        setForm(prev => ({ ...prev, kdSubKegiatan: pendapatan[0].kd_sub_kegiatan, nmSubKegiatan: pendapatan[0].nm_sub_kegiatan }));
      }
    });
    fetch("/api/master/sumber-dana").then(r => r.json()).then(d => setSumdans(d.data || []));
  }, [isEdit]);

  // Fetch rek6 from active budget based on kdUnit and tahun
  useEffect(() => {
    const unit = form.kdUnit || user?.kd_upt || "";
    const tahun = form.tahun || new Date().getFullYear().toString();
    if (unit && tahun) {
      fetch(`/api/penatausahaan/penerimaan/rekening?kd_upt=${unit}&tahun=${tahun}`).then(r => r.json()).then(d => {
        setRek6s(d.data || []);
      });
    }
  }, [form.kdUnit, form.tahun, user?.kd_upt]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    const url = isEdit ? `/api/penatausahaan/penerimaan/${initialData.idTerima}` : "/api/penatausahaan/penerimaan";
    const method = isEdit ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Berhasil',
          text: 'Data penerimaan berhasil disimpan',
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          router.push("/dashboard/penatausahaan/penerimaan");
          router.refresh();
        });
      } else {
        const errorData = await res.json();
        Swal.fire({
          icon: 'error',
          title: 'Gagal',
          text: errorData.message || "Gagal menyimpan data"
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
    <div className="card" style={{ width: "100%" }}>
      <div className="card-header">
        <span className="card-title">{isEdit ? "Edit Penerimaan" : "Tambah Penerimaan"}</span>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        {user?.role === "superadmin" ? (
          <div>
            <label className="form-label">UPT</label>
            <Select
              options={(upts || []).map((u: any) => ({ value: u.kd_upt, label: `${u.kd_upt} - ${u.nm_upt}`, data: u }))}
              value={form.kdUnit ? { value: form.kdUnit, label: `${form.kdUnit} - ${form.nmUnit}` } : null}
              onChange={(selected: any) => {
                setForm({ ...form, kdUnit: selected?.value || "", nmUnit: selected?.data?.nm_upt || "" });
              }}
              placeholder="-- Pilih UPT --"
              isClearable
              menuPosition="fixed"
              styles={{ control: (base) => ({ ...base, borderColor: '#e2e8f0', borderRadius: '0.375rem', minHeight: '42px' }) }}
            />
          </div>
        ) : null}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label className="form-label">Nomor Bukti</label>
            <input
              required
              readOnly={!isEdit}
              type="text"
              className="form-input bg-gray-100"
              value={form.noBukti}
              onChange={(e) => setForm({ ...form, noBukti: e.target.value })}
              placeholder="Otomatis"
              title="Dibuat otomatis"
            />
          </div>
          <div>
            <label className="form-label">Tanggal Bukti</label>
            <input
              required
              type="date"
              className="form-input"
              value={form.tglBukti}
              onChange={(e) => setForm({ ...form, tglBukti: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="form-label">Sub Kegiatan</label>
          <Select
            options={(subKegiatans || []).map((s: any) => ({ value: s.kd_sub_kegiatan, label: `${s.kd_sub_kegiatan} - ${s.nm_sub_kegiatan}`, data: s }))}
            value={form.kdSubKegiatan ? { value: form.kdSubKegiatan, label: `${form.kdSubKegiatan} - ${form.nmSubKegiatan}` } : null}
            onChange={(selected: any) => {
              setForm({ ...form, kdSubKegiatan: selected?.value || "", nmSubKegiatan: selected?.data?.nm_sub_kegiatan || "" });
            }}
            placeholder="-- Pilih Sub Kegiatan --"
            isClearable
            menuPosition="fixed"
            styles={{ control: (base) => ({ ...base, borderColor: '#e2e8f0', borderRadius: '0.375rem', minHeight: '42px' }) }}
          />
        </div>

        <div>
          <label className="form-label">Rekening (Rek 6)</label>
          <Select
            options={(rek6s || []).map((r: any) => ({ value: r.kd_rek6, label: `${r.kd_rek6} - ${r.nm_rek6}`, data: r }))}
            value={form.kdRek6 ? { value: form.kdRek6, label: `${form.kdRek6} - ${form.nmRek6}` } : null}
            onChange={(selected: any) => {
              setForm({ ...form, kdRek6: selected?.value || "", nmRek6: selected?.data?.nm_rek6 || "" });
            }}
            placeholder="-- Pilih Rekening --"
            isClearable
            menuPosition="fixed"
            styles={{ control: (base) => ({ ...base, borderColor: '#e2e8f0', borderRadius: '0.375rem', minHeight: '42px' }) }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label className="form-label">Sumber Dana</label>
            <Select
              options={(sumdans || []).map((s: any) => ({ value: s.sumdan, label: s.sumdan }))}
              value={form.sumdan ? { value: form.sumdan, label: form.sumdan } : null}
              onChange={(selected: any) => setForm({ ...form, sumdan: selected?.value || "" })}
              placeholder="-- Pilih Sumber Dana --"
              isClearable
              menuPosition="fixed"
              styles={{ control: (base) => ({ ...base, borderColor: '#e2e8f0', borderRadius: '0.375rem', minHeight: '42px' }) }}
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div>
            <label className="form-label">Nilai (Rp)</label>
            <input
              required
              type="number"
              min="0"
              step="0.01"
              className="form-input"
              value={form.nilai}
              onChange={(e) => setForm({ ...form, nilai: e.target.value })}
              placeholder="0"
            />
          </div>
          <div>
            <label className="form-label">Nama Penyetor</label>
            <input
              type="text"
              className="form-input"
              value={form.nmPenyetor}
              onChange={(e) => setForm({ ...form, nmPenyetor: e.target.value })}
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
          />
        </div>

        <div className="modal-footer" style={{ marginTop: 12 }}>
          <button type="button" onClick={() => router.back()} className="btn btn-ghost">Batal</button>
          <button type="submit" disabled={submitting} className="btn btn-primary">
            {submitting ? <span className="loading-spinner" /> : null}
            {submitting ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  );
}
