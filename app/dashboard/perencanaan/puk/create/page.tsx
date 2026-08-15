"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Select from "react-select";

export default function CreatePukPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tahun, setTahun] = useState<string>("");

  const [upts, setUpts] = useState<any[]>([]);
  const [ukms, setUkms] = useState<any[]>([]);
  const [peruntukans, setPeruntukans] = useState<any[]>([]);
  const [komponens, setKomponens] = useState<any[]>([]);
  const [rincians, setRincians] = useState<any[]>([]);
  const [subkegiatans, setSubKegiatans] = useState<any[]>([]);
  const [spms, setSpms] = useState<any[]>([]);
  const [sumdans, setSumdans] = useState<any[]>([]);

  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    kdUpt: "", nmUpt: "",
    kdUkm: "", nmUkm: "",
    kdPeruntukan: "", nmPeruntukan: "",
    kdKomponen: "", nmKomponen: "",
    kdRincian: "", nmRincian: "",
    kdSubKegiatan: "", nmSubKegiatan: "",
    kdSpm: "", nmSpm: "",
    tujuan: "", sasaran: "", targetSasaran: "", targetObjek: "", penanggungjawab: "", lokasi: "", sumdan: ""
  });

  useEffect(() => {
    fetch("/api/me").then(r => r.json()).then(d => {
      if (d.user) {
        setUser(d.user);
        setTahun(d.user.tahun || new Date().getFullYear().toString());

        if (d.user.role !== "superadmin") {
          setForm(prev => ({
            ...prev,
            kdUpt: d.user.kd_upt || "",
            nmUpt: d.user.nm_upt || ""
          }));
        }
      }
    }).catch(e => console.error("Gagal load user", e));
  }, []);

  const loadMasters = () => {
    fetch("/api/master/upt").then(r => r.json()).then(d => {
      setUpts(d.data || []);
      if (user && user.role !== "superadmin" && user.kd_upt) {
        const myUpt = (d.data || []).find((u: any) => u.kd_upt === user.kd_upt);
        if (myUpt) {
          setForm(prev => ({ ...prev, nmUpt: myUpt.nm_upt }));
        }
      }
    });
    fetch("/api/master/ukm").then(r => r.json()).then(d => setUkms(d.data || []));
    fetch("/api/master/peruntukan-kegiatan").then(r => r.json()).then(d => setPeruntukans(d.data || []));
    fetch("/api/master/sub-kegiatan?limit=1000").then(r => r.json()).then(d => setSubKegiatans(d.data || []));
    fetch("/api/master/spm?limit=1000").then(r => r.json()).then(d => setSpms(d.data || []));
    fetch("/api/master/sumber-dana?limit=1000").then(r => r.json()).then(d => setSumdans(d.data || []));
  };

  useEffect(() => {
    if (user) {
      loadMasters();
    }
  }, [user]);

  useEffect(() => {
    if (form.kdPeruntukan) {
      fetch(`/api/master/komponen-kegiatan?kd_peruntukan=${form.kdPeruntukan}`)
        .then(r => r.json()).then(d => setKomponens(d.data || []));
    } else { setKomponens([]); }
  }, [form.kdPeruntukan]);

  useEffect(() => {
    if (form.kdKomponen) {
      fetch(`/api/master/rincian-kegiatan?kd_komponen=${form.kdKomponen}`)
        .then(r => r.json()).then(d => setRincians(d.data || []));
    } else { setRincians([]); }
  }, [form.kdKomponen]);

  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/perencanaan/puk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, tahun })
      });
      const resData = await res.json();
      if (res.ok) {
        const newId = resData.data?.id;
        if (newId) {
          router.push(`/dashboard/perencanaan/puk/${newId}/rincian`);
        } else {
          router.push(`/dashboard/perencanaan/puk`);
        }
      } else {
        setErrorMsg(resData.error || "Terjadi kesalahan saat menyimpan data");
      }
    } catch (err) {
      setErrorMsg("Gagal menyimpan data");
    } finally {
      setSubmitting(false);
    }
  };

  const formLabelStyle = { fontWeight: 600, color: "#334155", fontSize: 13, marginBottom: 6, display: "block" };
  const formInputStyle = { background: "#F8FAFC", width: "100%", fontSize: 13, borderRadius: 6, border: "1px solid #E2E8F0", padding: "8px 12px" };
  const sectionTitleStyle = { fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid #E2E8F0" };

  return (
    <div className="animate-fadein relative pb-10">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>📝 Input Rencana Usulan Kegiatan</h1>
        </div>
        <Link href="/dashboard/perencanaan/puk">
          <button className="btn btn-outline">
            <ArrowLeft size={16} /> Kembali
          </button>
        </Link>
      </div>

      <div className="card">
        {errorMsg && (
          <div style={{ padding: "12px 16px", backgroundColor: "#FEE2E2", color: "#DC2626", borderRadius: "8px 8px 0 0", borderBottom: "1px solid #FECACA", fontSize: 14, fontWeight: 500 }}>
            ⚠️ {errorMsg}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div style={{ padding: 32, display: "grid", gap: 32 }}>
            {/* Bagian 1 */}
            <div>
              <h3 style={sectionTitleStyle}>Informasi Unit</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {user?.role === "superadmin" && (
                  <div>
                    <label style={formLabelStyle}>UPT *</label>
                    <Select menuPosition="fixed" options={[{ value: '', label: 'Pilih UPT...' }, ...upts.map((u: any) => ({ value: u.kd_upt, label: u.nm_upt }))]} value={{ value: form.kdUpt, label: form.nmUpt || 'Pilih UPT...' }} onChange={(e: any) => setForm({ ...form, kdUpt: e.value, nmUpt: e.label })} required styles={{
                      control: (base) => ({ ...base, fontSize: 13, background: '#F8FAFC', borderColor: '#E2E8F0', minHeight: 38 }),
                      menu: (base) => ({ ...base, zIndex: 9999 })
                    }} />
                  </div>
                )}
                <div>
                  <label style={formLabelStyle}>UKM *</label>
                  <Select menuPosition="fixed" options={[{ value: '', label: 'Pilih UKM...' }, ...ukms.map((u: any) => ({ value: u.kd_ukm, label: u.nm_ukm }))]} value={{ value: form.kdUkm, label: form.nmUkm || 'Pilih UKM...' }} onChange={(e: any) => setForm({ ...form, kdUkm: e.value, nmUkm: e.label })} isDisabled={user?.role === 'superadmin' && !form.kdUpt} required styles={{
                    control: (base) => ({ ...base, fontSize: 13, background: '#F8FAFC', borderColor: '#E2E8F0', minHeight: 38 }),
                    menu: (base) => ({ ...base, zIndex: 9999 })
                  }} />
                </div>
              </div>
            </div>

            {/* Bagian 2 */}
            <div>
              <h3 style={sectionTitleStyle}>Klasifikasi Kegiatan</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={formLabelStyle}>Peruntukan *</label>
                  <Select menuPosition="fixed" options={[{ value: '', label: 'Pilih Peruntukan...' }, ...peruntukans.map((p: any) => ({ value: p.kd_peruntukan, label: p.nm_peruntukan }))]} value={{ value: form.kdPeruntukan, label: form.nmPeruntukan || 'Pilih Peruntukan...' }} onChange={(e: any) => setForm({ ...form, kdPeruntukan: e.value, nmPeruntukan: e.label, kdKomponen: '', nmKomponen: '', kdRincian: '', nmRincian: '' })} isDisabled={user?.role === 'superadmin' && !form.kdUpt} required styles={{
                    control: (base) => ({ ...base, fontSize: 13, background: '#F8FAFC', borderColor: '#E2E8F0', minHeight: 38 }),
                    menu: (base) => ({ ...base, zIndex: 9999 })
                  }} />
                </div>
                <div>
                  <label style={formLabelStyle}>Komponen *</label>
                  <Select menuPosition="fixed" options={[{ value: '', label: 'Pilih Komponen...' }, ...komponens.map((k: any) => ({ value: k.kd_komponen, label: k.nm_komponen }))]} value={{ value: form.kdKomponen, label: form.nmKomponen || 'Pilih Komponen...' }} onChange={(e: any) => setForm({ ...form, kdKomponen: e.value, nmKomponen: e.label, kdRincian: '', nmRincian: '' })} isDisabled={!form.kdPeruntukan} required styles={{
                    control: (base) => ({ ...base, fontSize: 13, background: '#F8FAFC', borderColor: '#E2E8F0', minHeight: 38 }),
                    menu: (base) => ({ ...base, zIndex: 9999 })
                  }} />
                </div>
                <div>
                  <label style={formLabelStyle}>Rincian Kegiatan *</label>
                  <Select menuPosition="fixed" options={[{ value: '', label: 'Pilih Rincian...' }, ...rincians.map((r: any) => ({ value: r.kd_rincian, label: r.nm_rincian }))]} value={{ value: form.kdRincian, label: form.nmRincian || 'Pilih Rincian...' }} onChange={(e: any) => setForm({ ...form, kdRincian: e.value, nmRincian: e.label })} isDisabled={!form.kdKomponen} required styles={{
                    control: (base) => ({ ...base, fontSize: 13, background: '#F8FAFC', borderColor: '#E2E8F0', minHeight: 38 }),
                    menu: (base) => ({ ...base, zIndex: 9999 })
                  }} />
                </div>
                <div>
                  <label style={formLabelStyle}>Sub Kegiatan *</label>
                  <Select menuPosition="fixed" options={[{ value: '', label: 'Pilih Sub Kegiatan...' }, ...subkegiatans.map((s: any) => ({ value: s.kd_sub_kegiatan, label: s.nm_sub_kegiatan }))]} value={{ value: form.kdSubKegiatan, label: form.nmSubKegiatan || 'Pilih Sub Kegiatan...' }} onChange={(e: any) => setForm({ ...form, kdSubKegiatan: e.value, nmSubKegiatan: e.label })} required styles={{
                    control: (base) => ({ ...base, fontSize: 13, background: '#F8FAFC', borderColor: '#E2E8F0', minHeight: 38 }),
                    menu: (base) => ({ ...base, zIndex: 9999 })
                  }} />
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={formLabelStyle}>Standar Pelayanan Minimal (SPM) *</label>
                  <Select menuPosition="fixed" options={[{ value: '', label: 'Pilih SPM...' }, ...spms.map((s: any) => ({ value: s.kd_spm, label: s.nm_spm }))]} value={{ value: form.kdSpm, label: form.nmSpm || 'Pilih SPM...' }} onChange={(e: any) => setForm({ ...form, kdSpm: e.value, nmSpm: e.label })} isDisabled={user?.role === 'superadmin' && !form.kdUpt} required styles={{
                    control: (base) => ({ ...base, fontSize: 13, background: '#F8FAFC', borderColor: '#E2E8F0', minHeight: 38 }),
                    menu: (base) => ({ ...base, zIndex: 9999 })
                  }} />
                </div>
                <div>
                  <label style={formLabelStyle}>Sumber Dana *</label>
                  <Select menuPosition="fixed" options={[{ value: '', label: 'Pilih Sumber Dana...' }, ...sumdans.map((s: any) => ({ value: s.sumdan, label: s.sumdan }))]} value={{ value: form.sumdan, label: form.sumdan || 'Pilih Sumber Dana...' }} onChange={(e: any) => setForm({ ...form, sumdan: e.value })} required styles={{
                    control: (base) => ({ ...base, fontSize: 13, background: '#F8FAFC', borderColor: '#E2E8F0', minHeight: 38 }),
                    menu: (base) => ({ ...base, zIndex: 9999 })
                  }} />
                </div>
              </div>
            </div>

            {/* Bagian 3 */}
            <div>
              <h3 style={sectionTitleStyle}>Target & Detail Pelaksanaan</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div><label style={formLabelStyle}>Tujuan *</label><input type="text" style={formInputStyle} value={form.tujuan} onChange={e => setForm({ ...form, tujuan: e.target.value })} required /></div>
                <div><label style={formLabelStyle}>Sasaran *</label><input type="text" style={formInputStyle} value={form.sasaran} onChange={e => setForm({ ...form, sasaran: e.target.value })} required /></div>
                <div><label style={formLabelStyle}>Target Sasaran *</label><input type="text" style={formInputStyle} value={form.targetSasaran} onChange={e => setForm({ ...form, targetSasaran: e.target.value })} required /></div>
                <div><label style={formLabelStyle}>Target Objek (Angka) *</label><input type="number" style={formInputStyle} value={form.targetObjek} onChange={e => setForm({ ...form, targetObjek: e.target.value })} required /></div>
                <div><label style={formLabelStyle}>Penanggung Jawab *</label><input type="text" style={formInputStyle} value={form.penanggungjawab} onChange={e => setForm({ ...form, penanggungjawab: e.target.value })} required /></div>
                <div><label style={formLabelStyle}>Lokasi *</label><input type="text" style={formInputStyle} value={form.lokasi} onChange={e => setForm({ ...form, lokasi: e.target.value })} required /></div>

              </div>
            </div>

          </div>

          <div style={{ padding: "16px 32px", background: "#F8FAFC", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "flex-end", gap: 8, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}>
            <Link href="/dashboard/perencanaan/puk">
              <button type="button" className="btn btn-outline" disabled={submitting}>Batalkan</button>
            </Link>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Menyimpan..." : <><Check size={16} /> Simpan & Lanjut ke Rincian</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
