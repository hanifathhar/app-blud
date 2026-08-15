"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2, X, Check, Edit3, Settings, MapPin, Target, DollarSign, Activity } from "lucide-react";
import Link from "next/link";
import Select from "react-select";

export default function PukRincianPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [puk, setPuk] = useState<any>(null);
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showInfoForm, setShowInfoForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sumdans, setSumdans] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [infoForm, setInfoForm] = useState({
    sasaran: "", tujuan: "", lokasi: "", sumdan: "",
    targetSasaran: "", targetObjek: "", penanggungjawab: ""
  });

  const [form, setForm] = useState({
    id: null as number | null,
    uraian: "", volume: 0, satuan: "", harga: 0,
    jan: 0, feb: 0, mar: 0, apr: 0, mei: 0, jun: 0, jul: 0, agus: 0, sep: 0, okt: 0, nov: 0, des: 0
  });

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Master PUK
      const resPuk = await fetch(`/api/perencanaan/puk-pendapatan/${id}`);
      if (!resPuk.ok) throw new Error("PUK tidak ditemukan");
      const dataPuk = await resPuk.json();
      setPuk(dataPuk.data);

      // 2. Fetch Rincian
      if (dataPuk.data?.noPuk) {
        const resRincian = await fetch(`/api/perencanaan/puk-pendapatan/rincian?noPuk=${encodeURIComponent(dataPuk.data.noPuk)}`);
        const dataRincian = await resRincian.json();
        setList(dataRincian.data || []);
      }
      // 3. Fetch Master Sumber Dana
      const resSumdan = await fetch("/api/master/sumber-dana?limit=100");
      if (resSumdan.ok) {
        const dataSumdan = await resSumdan.json();
        setSumdans(dataSumdan.data || []);
      }
    } catch (err) {
      alert("Gagal memuat data rincian PUK");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = form.id ? `/api/perencanaan/puk-pendapatan/rincian/${form.id}` : "/api/perencanaan/puk-pendapatan/rincian";
      const method = form.id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, noPuk: puk.noPuk })
      });
      if (res.ok) {
        setShowForm(false);
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menyimpan rincian");
      }
    } catch (err) {
      alert("Gagal menyimpan data");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/perencanaan/puk-pendapatan/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...puk, ...infoForm })
      });
      if (res.ok) {
        setShowInfoForm(false);
        loadData();
      } else {
        const err = await res.json();
        alert(err.error || "Gagal menyimpan info PUK");
      }
    } catch (err) {
      alert("Gagal menyimpan data");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenInfoForm = () => {
    setInfoForm({
      sasaran: puk?.sasaran || "",
      tujuan: puk?.tujuan || "",
      lokasi: puk?.lokasi || "",
      sumdan: puk?.sumdan || "",
      targetSasaran: puk?.targetSasaran || "",
      targetObjek: puk?.targetObjek || "",
      penanggungjawab: puk?.penanggungjawab || ""
    });
    setShowInfoForm(true);
  };

  const handleDelete = async (rincianId: number) => {
    if (!confirm("Hapus rincian ini?")) return;
    try {
      await fetch(`/api/perencanaan/puk-pendapatan/rincian/${rincianId}`, { method: "DELETE" });
      loadData();
    } catch (e) {
      alert("Gagal menghapus rincian");
    }
  };

  const handleOpenForm = () => {
    setForm({
      id: null,
      uraian: "", volume: 0, satuan: "", harga: 0,
      jan: 0, feb: 0, mar: 0, apr: 0, mei: 0, jun: 0, jul: 0, agus: 0, sep: 0, okt: 0, nov: 0, des: 0
    });
    setShowForm(true);
  };

  const handleEditForm = (item: any) => {
    setForm({
      id: item.id,
      uraian: item.uraian || "",
      volume: Number(item.volume) || 0,
      satuan: item.satuan || "",
      harga: Number(item.harga) || 0,
      jan: Number(item.jan) || 0, feb: Number(item.feb) || 0, mar: Number(item.mar) || 0,
      apr: Number(item.apr) || 0, mei: Number(item.mei) || 0, jun: Number(item.jun) || 0,
      jul: Number(item.jul) || 0, agus: Number(item.agus) || 0, sep: Number(item.sep) || 0,
      okt: Number(item.okt) || 0, nov: Number(item.nov) || 0, des: Number(item.des) || 0
    });
    setShowForm(true);
  };

  const formLabelStyle = { fontWeight: 600, color: "#334155", fontSize: 13, marginBottom: 6, display: "block" };
  const formInputStyle = { background: "#F8FAFC", width: "100%", fontSize: 13, borderRadius: 6, border: "1px solid #E2E8F0", padding: "8px 12px" };

  if (loading && !puk) {
    return <div className="p-8 text-center"><div className="loading-spinner"></div> Memuat data...</div>;
  }

  if (!puk) {
    return <div className="p-8 text-center text-red-500 font-semibold">Data PUK tidak ditemukan.</div>;
  }

  return (
    <div className="animate-fadein relative pb-10">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>Rincian Rencana Usulan Kegiatan</h1>
        </div>
        <Link href="/dashboard/perencanaan/puk-pendapatan">
          <button className="btn btn-outline">
            <ArrowLeft size={16} /> Kembali
          </button>
        </Link>
      </div>

      {/* Info Card Baru yang Lebih Responsif & Profesional */}
      <div className="card mb-10" style={{ padding: 0, overflow: "hidden", background: "#fff", border: "1px solid #E2E8F0", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
        <div style={{ background: "linear-gradient(to right, #1E293B, #0F172A)", color: "white", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 13, color: "#94A3B8", marginBottom: 4 }}>No. PUK: {puk.noPuk}</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#F8FAFC" }}>{puk.kdSubKegiatan ? `${puk.kdSubKegiatan} - ${puk.nmSubKegiatan || "-"}` : puk.nmSubKegiatan || "-"}</h2>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, color: "#94A3B8", marginBottom: 4 }}>Total Anggaran</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#38BDF8", letterSpacing: "-0.5px" }}>
              Rp {new Intl.NumberFormat('id-ID').format(puk.nilai || 0)}
            </div>
          </div>
        </div>

        <div style={{ padding: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "220px 10px 1fr", gap: "8px 0", fontSize: 13, color: "#334155", marginBottom: 24 }}>
            <div>Program</div>
            <div>:</div>
            <div>{puk.kdProgram ? `${puk.kdProgram} - ${puk.nmProgram}` : puk.nmProgram || "-"}</div>

            <div>Kegiatan</div>
            <div>:</div>
            <div>{puk.kdKegiatan ? `${puk.kdKegiatan} - ${puk.nmKegiatan}` : puk.nmKegiatan || "-"}</div>

            <div>Sub Kegiatan</div>
            <div>:</div>
            <div>{puk.kdSubKegiatan ? `${puk.kdSubKegiatan} - ${puk.nmSubKegiatan}` : puk.nmSubKegiatan || "-"}</div>
          </div>

          <div style={{ padding: 16, background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <Activity size={18} color="#3B82F6" />
                Detail Operasional
              </h3>
              <button className="btn btn-outline btn-sm" onClick={handleOpenInfoForm} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                <Settings size={14} /> Ubah Info
              </button>
            </div>
            <div className="tbl-wrap" style={{ borderRadius: 8, marginTop: 12 }}>
              <table className="tbl">
                <tbody>
                  <tr>
                    <td style={{ width: '25%', fontWeight: 600, color: '#64748B', fontSize: 13 }}>Tujuan</td>
                    <td style={{ fontSize: 14, color: '#1E293B' }}>{puk.tujuan || "-"}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, color: '#64748B', fontSize: 13 }}>Sasaran</td>
                    <td style={{ fontSize: 14, color: '#1E293B' }}>{puk.sasaran || "-"}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, color: '#64748B', fontSize: 13 }}>Target Sasaran</td>
                    <td style={{ fontSize: 14, color: '#1E293B' }}>{puk.targetSasaran || "-"}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, color: '#64748B', fontSize: 13 }}>Target Objek</td>
                    <td style={{ fontSize: 14, color: '#1E293B' }}>{puk.targetObjek || "-"}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, color: '#64748B', fontSize: 13 }}>Lokasi</td>
                    <td style={{ fontSize: 14, color: '#1E293B' }}>{puk.lokasi || "-"}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, color: '#64748B', fontSize: 13 }}>Penanggung Jawab</td>
                    <td style={{ fontSize: 14, color: '#1E293B' }}>{puk.penanggungjawab || "-"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ height: 1, background: "#E2E8F0", margin: "32px 0 24px 0" }}></div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0 }}>Daftar Rincian Anggaran</h3>
            <button className="btn btn-primary btn-sm" onClick={handleOpenForm}>
              <Plus size={16} /> Tambah Rincian
            </button>
          </div>

          <div className="tbl-wrap" style={{ borderRadius: 0 }}>
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{ width: 40, textAlign: "center" }}>No.</th>
                  <th>Uraian</th>
                  <th style={{ textAlign: "right" }}>Volume</th>
                  <th style={{ textAlign: "right" }}>Satuan</th>
                  <th style={{ textAlign: "right" }}>Harga Satuan</th>
                  <th style={{ textAlign: "right" }}>Total</th>
                  <th style={{ width: 60, textAlign: "center" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {list.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: 32, color: "#64748B" }}>
                      Belum ada rincian. Silakan klik "Tambah Rincian".
                    </td>
                  </tr>
                ) : (
                  list.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((item, i) => (
                    <tr key={item.id}>
                      <td style={{ textAlign: "center", fontSize: 12, color: "#64748B" }}>{(currentPage - 1) * itemsPerPage + i + 1}</td>
                      <td style={{ fontSize: 13, color: "#334155", fontWeight: 600 }}>{item.uraian}</td>
                      <td style={{ textAlign: "right", fontSize: 13, color: "#334155" }}>
                        {new Intl.NumberFormat('id-ID').format(item.volume || 0)}
                      </td>
                      <td style={{ textAlign: "right", fontSize: 13, color: "#334155" }}>
                        {item.satuan}
                      </td>
                      <td style={{ textAlign: "right", fontSize: 13, color: "#334155" }}>
                        {new Intl.NumberFormat('id-ID').format(item.harga || 0)}
                      </td>
                      <td style={{ textAlign: "right", fontSize: 13, fontWeight: 600, color: "#0F172A" }}>
                        {new Intl.NumberFormat('id-ID').format(item.total || 0)}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 5, justifyContent: "center" }}>
                          <button className="btn btn-sm" style={{ background: "#E0F2FE", color: "#0284C7", borderColor: "#BAE6FD" }} onClick={() => handleEditForm(item)} title="Edit">
                            <Edit3 size={12} />
                          </button>
                          <button className="btn btn-sm" style={{ background: "#FEE2E2", color: "#DC2626", borderColor: "#FECACA" }} onClick={() => handleDelete(item.id)} title="Hapus">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {list.length > 0 && (
                <tfoot style={{ background: "#F8FAFC" }}>
                  <tr>
                    <td colSpan={5} style={{ textAlign: "right", fontWeight: 700, fontSize: 13, color: "#0F172A", padding: "12px 16px" }}>
                      Jumlah Total :
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 800, fontSize: 14, color: "#38BDF8", padding: "12px 16px" }}>
                      Rp {new Intl.NumberFormat('id-ID').format(list.reduce((sum, item) => sum + (Number(item.total) || 0), 0))}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {list.length > itemsPerPage && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0" }}>
              <div style={{ fontSize: 13, color: "#64748B" }}>
                Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, list.length)} dari {list.length} rincian
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn btn-sm btn-outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  style={{ padding: "4px 12px", fontSize: 13 }}
                >
                  Sebelumnya
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  {Array.from({ length: Math.ceil(list.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      style={{
                        width: 28, height: 28, borderRadius: 4, border: "none", cursor: "pointer", fontSize: 13,
                        background: currentPage === page ? "#3B82F6" : "transparent",
                        color: currentPage === page ? "#fff" : "#475569",
                        fontWeight: currentPage === page ? 600 : 400
                      }}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  className="btn btn-sm btn-outline"
                  disabled={currentPage === Math.ceil(list.length / itemsPerPage)}
                  onClick={() => setCurrentPage(p => p + 1)}
                  style={{ padding: "4px 12px", fontSize: 13 }}
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Dialog Form */}
      {showForm && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.4)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "fadeIn 0.2s ease-out"
        }}>
          <div style={{
            background: "#fff", width: 800, borderRadius: 16,
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            animation: "slideUp 0.3s ease-out",
            maxHeight: "90vh", display: "flex", flexDirection: "column"
          }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", margin: 0 }}>
                {form.id ? "📝 Edit Rincian RUK Pendapatan" : "➕ Tambah Rincian RUK Pendapatan"}
              </h2>
              <button type="button" onClick={() => setShowForm(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#94A3B8" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ overflowY: "auto", flex: 1 }}>
              <div style={{ padding: 24, display: "grid", gap: 24 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label style={formLabelStyle}>Uraian *</label>
                    <input type="text" style={formInputStyle} value={form.uraian} onChange={e => setForm({ ...form, uraian: e.target.value })} required />
                  </div>
                  <div>
                    <label style={formLabelStyle}>Volume *</label>
                    <input type="number" style={formInputStyle} value={form.volume} onChange={e => setForm({ ...form, volume: Number(e.target.value) })} required />
                  </div>
                  <div>
                    <label style={formLabelStyle}>Satuan *</label>
                    <input type="text" style={formInputStyle} value={form.satuan} onChange={e => setForm({ ...form, satuan: e.target.value })} required />
                  </div>
                  <div>
                    <label style={formLabelStyle}>Harga Satuan (Rp.) *</label>
                    <input type="number" style={formInputStyle} value={form.harga} onChange={e => setForm({ ...form, harga: Number(e.target.value) })} required />
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E2E8F0", paddingBottom: 8, marginBottom: 12 }}>
                    <div>
                      <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", margin: 0 }}>Alokasi Bulanan</h3>
                      <p style={{ fontSize: 12, color: "#64748B", margin: 0 }}>Nilai Akumulasi (Volume × Harga): <strong style={{ color: "#0F172A" }}>Rp {new Intl.NumberFormat('id-ID').format((form.volume || 0) * (form.harga || 0))}</strong></p>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => {
                        const total = (form.volume || 0) * (form.harga || 0);
                        const perBulan = Math.floor(total / 12);
                        const sisa = total % 12;
                        setForm({
                          ...form,
                          jan: perBulan + sisa, // sisa ditambahkan ke bulan pertama (opsional)
                          feb: perBulan, mar: perBulan, apr: perBulan,
                          mei: perBulan, jun: perBulan, jul: perBulan,
                          agus: perBulan, sep: perBulan, okt: perBulan,
                          nov: perBulan, des: perBulan
                        });
                      }}
                    >
                      Bagi 12 Bulan
                    </button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
                    {["jan", "feb", "mar", "apr", "mei", "jun", "jul", "agus", "sep", "okt", "nov", "des"].map(bln => (
                      <div key={bln}>
                        <label style={{ ...formLabelStyle, textTransform: "capitalize" }}>{bln}</label>
                        <input type="number" style={formInputStyle} value={(form as any)[bln]} onChange={e => setForm({ ...form, [bln]: Number(e.target.value) })} />
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 12, textAlign: "right", fontSize: 13, color: "#64748B" }}>
                    <strong>Total Bulan:</strong> Rp {new Intl.NumberFormat('id-ID').format(
                      form.jan + form.feb + form.mar + form.apr + form.mei + form.jun + form.jul + form.agus + form.sep + form.okt + form.nov + form.des
                    )}
                  </div>
                </div>
              </div>

              <div style={{ padding: "16px 24px", borderTop: "1px solid #F1F5F9", background: "#F8FAFC", borderBottomLeftRadius: 16, borderBottomRightRadius: 16, display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)} style={{ background: "#fff" }}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <span className="loading-spinner" /> : <Check size={16} />}
                  {submitting ? "Menyimpan..." : "Simpan Rincian"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dialog Edit Info PUK */}
      {showInfoForm && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center",
          animation: "fadeIn 0.2s ease-out", backdropFilter: "blur(2px)"
        }}>
          <div style={{
            background: "#fff", width: 600, borderRadius: 16,
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            animation: "slideUp 0.3s ease-out",
            maxHeight: "90vh", display: "flex", flexDirection: "column"
          }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid #F1F5F9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <Settings size={20} color="#3B82F6" />
                Edit Informasi Operasional PUK
              </h2>
              <button type="button" onClick={() => setShowInfoForm(false)} style={{ background: "transparent", border: "none", cursor: "pointer", color: "#94A3B8" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleInfoSubmit} style={{ overflowY: "auto", flex: 1 }}>
              <div style={{ padding: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={formLabelStyle}>Tujuan</label>
                  <textarea style={{ ...formInputStyle, minHeight: 60, resize: "vertical" }} value={infoForm.tujuan} onChange={e => setInfoForm({ ...infoForm, tujuan: e.target.value })} placeholder="Tujuan kegiatan..." />
                </div>
                <div style={{ gridColumn: "1 / -1" }}>
                  <label style={formLabelStyle}>Sasaran</label>
                  <textarea style={{ ...formInputStyle, minHeight: 60, resize: "vertical" }} value={infoForm.sasaran} onChange={e => setInfoForm({ ...infoForm, sasaran: e.target.value })} placeholder="Sasaran kegiatan..." />
                </div>
                <div>
                  <label style={formLabelStyle}>Target Sasaran</label>
                  <input type="text" style={formInputStyle} value={infoForm.targetSasaran} onChange={e => setInfoForm({ ...infoForm, targetSasaran: e.target.value })} placeholder="Misal: 100 Orang..." />
                </div>
                <div>
                  <label style={formLabelStyle}>Target Objek (Angka)</label>
                  <input type="number" style={formInputStyle} value={infoForm.targetObjek} onChange={e => setInfoForm({ ...infoForm, targetObjek: e.target.value })} placeholder="Misal: 100" />
                </div>
                <div>
                  <label style={formLabelStyle}>Penanggung Jawab</label>
                  <input type="text" style={formInputStyle} value={infoForm.penanggungjawab} onChange={e => setInfoForm({ ...infoForm, penanggungjawab: e.target.value })} placeholder="Nama PJ..." />
                </div>
                <div>
                  <label style={formLabelStyle}>Lokasi</label>
                  <input type="text" style={formInputStyle} value={infoForm.lokasi} onChange={e => setInfoForm({ ...infoForm, lokasi: e.target.value })} placeholder="Lokasi kegiatan..." />
                </div>
              </div>

              <div style={{ padding: "16px 24px", borderTop: "1px solid #F1F5F9", background: "#F8FAFC", borderBottomLeftRadius: 16, borderBottomRightRadius: 16, display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowInfoForm(false)} style={{ background: "#fff" }}>Batal</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? <span className="loading-spinner" /> : <Check size={16} />}
                  {submitting ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}} />
    </div>
  );
}
