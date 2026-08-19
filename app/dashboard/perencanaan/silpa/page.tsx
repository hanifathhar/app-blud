"use client";

import React, { useState, useEffect } from "react";
import { Check, CheckCircle, RefreshCcw, Save, Trash2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Select from "react-select";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

const DEFAULT_SILPA_CODES = [
  { kd_rek6: "6.1.01.08.01.0001", nm_rek6: "Sisa Lebih Perhitungan Anggaran BLUD", nilai: 0 },
  { kd_rek6: "6.1.01.08.03.0001", nm_rek6: "Sisa Dana Kapitasi", nilai: 0 },
  { kd_rek6: "6.1.01.01.04.0018", nm_rek6: "Pelampauan Penerimaan PAD-Pendapatan Dana Kapitasi JKN pada FKTP", nilai: 0 },
];

export default function SilpaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  const [silpaData, setSilpaData] = useState(DEFAULT_SILPA_CODES.map(d => ({ ...d })));
  const [status, setStatus] = useState("draft");

  // Superadmin UPT Selection
  const [upts, setUpts] = useState<any[]>([]);
  const [selectedUpt, setSelectedUpt] = useState<string>("");
  
  useEffect(() => {
    fetchUserAndData();
  }, []);

  const fetchUserAndData = async () => {
    try {
      setLoading(true);
      const resUser = await fetch("/api/me");
      const dataUser = await resUser.json();
      
      if (dataUser.user) {
        setUser(dataUser.user);
        if (dataUser.user.role === "superadmin") {
          const resUpts = await fetch("/api/master/upt?limit=100");
          const dataUpts = await resUpts.json();
          setUpts(dataUpts.data || []);
        } else {
          await fetchData(dataUser.user.kd_upt, dataUser.user.tahun);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === "superadmin" && selectedUpt) {
      fetchData(selectedUpt, user.tahun);
    }
  }, [selectedUpt, user]);

  const fetchData = async (kdUnit: string, tahun: string) => {
    try {
      const res = await fetch(`/api/perencanaan/silpa?kdUnit=${kdUnit}&tahun=${tahun}`);
      const d = await res.json();
      if (d.success && d.data.length > 0) {
        const merged = DEFAULT_SILPA_CODES.map(def => {
          const found = d.data.find((item: any) => item.kd_rek6 === def.kd_rek6);
          if (found) {
            setStatus(found.status);
            return { ...def, nilai: Number(found.nilai) };
          }
          return def;
        });
        setSilpaData(merged);
      } else {
        setSilpaData(DEFAULT_SILPA_CODES.map(d => ({ ...d })));
        setStatus("draft");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleNilaiChange = (index: number, val: string) => {
    const rawValue = val.replace(/[^0-9]/g, '');
    const numValue = rawValue ? parseInt(rawValue, 10) : 0;
    
    const newData = [...silpaData];
    newData[index].nilai = numValue;
    setSilpaData(newData);
  };

  const getCurrentKdUpt = () => {
    return user?.role === "superadmin" ? selectedUpt : user?.kd_upt;
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) return;
    const kd_upt = getCurrentKdUpt();
    if (!kd_upt) {
      MySwal.fire({ icon: 'warning', title: 'Peringatan', text: "Silakan pilih UPT terlebih dahulu" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/perencanaan/silpa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kd_upt: kd_upt,
          tahun: user.tahun,
          data: silpaData
        })
      });
      const d = await res.json();
      if (d.success) {
        MySwal.fire({ icon: 'success', title: 'Berhasil', text: "Data berhasil disimpan" });
        fetchData(kd_upt, user.tahun);
      } else {
        MySwal.fire({ icon: 'error', title: 'Gagal', text: d.message });
      }
    } catch (e) {
      MySwal.fire({ icon: 'error', title: 'Gagal', text: "Terjadi kesalahan saat menyimpan data" });
    } finally {
      setSaving(false);
    }
  };

  const handleHapus = async () => {
    if (!user) return;
    const kd_upt = getCurrentKdUpt();
    if (!kd_upt) return;

    const result = await MySwal.fire({
      title: 'Hapus Data SILPA?',
      text: "Apakah Anda yakin ingin menghapus seluruh data SILPA tahun ini?",
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#DC2626',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Ya, Hapus!',
      cancelButtonText: 'Batal'
    });
    
    if (!result.isConfirmed) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/perencanaan/silpa?kdUnit=${kd_upt}&tahun=${user.tahun}`, {
        method: "DELETE",
      });
      const d = await res.json();
      if (d.success) {
        MySwal.fire({ icon: 'success', title: 'Berhasil', text: "Data SILPA berhasil dihapus!" });
        fetchData(kd_upt, user.tahun);
      } else {
        MySwal.fire({ icon: 'error', title: 'Gagal', text: d.message });
      }
    } catch (e) {
      MySwal.fire({ icon: 'error', title: 'Gagal', text: "Terjadi kesalahan saat menghapus data" });
    } finally {
      setSaving(false);
    }
  };

  const handleBatalkanPenetapan = async () => {
    if (!user) return;
    const kd_upt = getCurrentKdUpt();
    if (!kd_upt) return;

    const result = await MySwal.fire({
      title: 'Batalkan Penetapan SILPA?',
      text: "Data SILPA ini akan dikembalikan ke status DRAFT dan dihapus dari Dokumen Penetapan. Apakah Anda yakin?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#F59E0B',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Ya, Batalkan!',
      cancelButtonText: 'Batal'
    });
    
    if (!result.isConfirmed) return;
    
    setSaving(true);
    try {
      const res = await fetch(`/api/perencanaan/silpa/batalkan-penetapan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kdUnit: kd_upt, tahun: user.tahun })
      });
      const d = await res.json();
      if (d.success) {
        MySwal.fire({ icon: 'success', title: 'Berhasil', text: "Penetapan SILPA berhasil dibatalkan dan dikembalikan ke DRAFT." });
        fetchData(kd_upt, user.tahun);
      } else {
        MySwal.fire({ icon: 'error', title: 'Gagal', text: d.message });
      }
    } catch (e) {
      MySwal.fire({ icon: 'error', title: 'Gagal', text: "Terjadi kesalahan saat membatalkan penetapan" });
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID').format(val);
  };

  const formLabelStyle = { fontWeight: 600, color: "#334155", fontSize: 13, marginBottom: 6, display: "block" };
  const formInputStyle = { background: "#F8FAFC", width: "100%", fontSize: 13, borderRadius: 6, border: "1px solid #E2E8F0", padding: "8px 12px" };
  const sectionTitleStyle = { fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid #E2E8F0" };

  if (loading) {
    return (
      <div className="empty-state" style={{ padding: 48 }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  const isDitetapkan = status === "ditetapkan";
  const kd_upt_ready = getCurrentKdUpt();
  const totalSilpa = silpaData.reduce((acc, curr) => acc + curr.nilai, 0);

  return (
    <div className="animate-fadein relative pb-10">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>💼 Input SILPA Tahun Lalu</h1>
        </div>
      </div>

      <div className="card">
        {/* Status Banner */}
        {kd_upt_ready && (
          <div style={{
            padding: "12px 16px",
            backgroundColor: isDitetapkan ? "#ECFDF5" : "#FFFBEB",
            color: isDitetapkan ? "#047857" : "#B45309",
            borderRadius: "8px 8px 0 0",
            borderBottom: `1px solid ${isDitetapkan ? "#A7F3D0" : "#FDE68A"}`,
            fontSize: 14,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {isDitetapkan ? <CheckCircle size={18} /> : <RefreshCcw size={18} />}
              Status: {isDitetapkan ? "DITETAPKAN" : "DRAFT"} - {isDitetapkan ? "Data SILPA telah terposting ke dokumen penetapan." : "Isi data dan Simpan. Data akan otomatis ditetapkan saat Anda melakukan Penetapan RBA."}
            </div>
            {isDitetapkan && (
              <button type="button" onClick={handleBatalkanPenetapan} disabled={saving} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 6, backgroundColor: "#F59E0B", color: "#fff", fontWeight: 600, border: "none", cursor: "pointer", fontSize: 12 }}>
                <XCircle size={14} /> Batalkan Penetapan
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSave}>
          <div style={{ padding: 32, display: "grid", gap: 32 }}>
            
            {/* Informasi Unit */}
            {user?.role === "superadmin" && (
              <div>
                <h3 style={sectionTitleStyle}>Informasi Unit</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
                  <div>
                    <label style={formLabelStyle}>Pilih UPT *</label>
                    <Select 
                      menuPosition="fixed" 
                      options={[{ value: '', label: 'Pilih UPT...' }, ...upts.map((u: any) => ({ value: u.kd_upt, label: u.nm_upt }))]} 
                      value={{ value: selectedUpt, label: upts.find(u => u.kd_upt === selectedUpt)?.nm_upt || 'Pilih UPT...' }} 
                      onChange={(e: any) => setSelectedUpt(e.value)} 
                      required 
                      styles={{
                        control: (base) => ({ ...base, fontSize: 13, background: '#F8FAFC', borderColor: '#E2E8F0', minHeight: 38 }),
                        menu: (base) => ({ ...base, zIndex: 9999 })
                      }} 
                    />
                  </div>
                </div>
              </div>
            )}

            {!kd_upt_ready ? (
              <div style={{ padding: 48, textAlign: "center", color: "#64748B", fontSize: 14 }}>
                Silakan pilih UPT terlebih dahulu untuk mengelola data SILPA.
              </div>
            ) : (
              <>
                {/* Rincian SILPA */}
                <div>
                  <h3 style={sectionTitleStyle}>Rincian Anggaran</h3>
                  <table className="tbl" style={{ marginTop: 0 }}>
                    <thead>
                      <tr>
                        <th style={{ width: "20%" }}>Kode Rekening</th>
                        <th style={{ width: "50%" }}>Uraian</th>
                        <th style={{ width: "30%", textAlign: "right" }}>Nilai (Rp)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {silpaData.map((item, index) => (
                        <tr key={item.kd_rek6}>
                          <td style={{ fontSize: 13, color: "#334155", fontWeight: 600 }}>{item.kd_rek6}</td>
                          <td style={{ fontSize: 13, color: "#334155" }}>{item.nm_rek6}</td>
                          <td style={{ textAlign: "right" }}>
                            {isDitetapkan ? (
                              <div style={{ fontSize: 13, fontWeight: 700, color: "#0F172A", padding: "8px 12px" }}>
                                {formatCurrency(item.nilai)}
                              </div>
                            ) : (
                              <input
                                type="text"
                                style={{ ...formInputStyle, textAlign: "right", fontWeight: 600, color: "#0F172A" }}
                                value={formatCurrency(item.nilai)}
                                onChange={(e) => handleNilaiChange(index, e.target.value)}
                              />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={2} style={{ textAlign: "right", fontWeight: 700, fontSize: 14, color: "#0F172A" }}>TOTAL SILPA:</td>
                        <td style={{ textAlign: "right", fontWeight: 800, fontSize: 15, color: "#0F172A", padding: "12px" }}>
                          Rp {formatCurrency(totalSilpa)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            )}
          </div>

          {kd_upt_ready && !isDitetapkan && (
            <div style={{ padding: "16px 32px", background: "#F8FAFC", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" className="btn btn-outline" onClick={handleHapus} disabled={saving} style={{ display: "flex", alignItems: "center", gap: 8, color: "#DC2626", borderColor: "#FECACA", backgroundColor: "#FEF2F2" }}>
                  <Trash2 size={16} /> Hapus Data
                </button>
              </div>
              <div>
                <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Save size={16} /> Simpan Data
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
