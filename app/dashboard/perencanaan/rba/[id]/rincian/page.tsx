"use client";

import React, { useState, useEffect, use, Fragment } from "react";
import { ArrowLeft, Save, Edit2, Trash2, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import Link from "next/link";
import Swal from "sweetalert2";

export default function RincianRbaPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const { id: no_rba } = resolvedParams;
  const [rba, setRba] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Edit State
  const [editingId, setEditingId] = useState<any>(null);
  const [editForm, setEditForm] = useState({ volume: "", harga: "", kd_rek6: "", nm_rek6: "", uraian: "", satuan: "" });
  const [saving, setSaving] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Add State
  const [showAddModal, setShowAddModal] = useState(false);
  const [pukOptions, setPukOptions] = useState<any[]>([]);
  const [addForm, setAddForm] = useState({ volume: "", harga: "", kd_rek6: "", nm_rek6: "", uraian: "", satuan: "" });
  const [savingAdd, setSavingAdd] = useState(false);

  useEffect(() => {
    loadData();
  }, [no_rba]);

  const loadData = () => {
    setLoading(true);
    fetch(`/api/perencanaan/rba/${no_rba}/rincian`)
      .then(r => r.json())
      .then(d => {
        if (d.data) setRba(d.data);
      })
      .finally(() => setLoading(false));
  };

  const loadRek6Options = async (inputValue: string) => {
    const res = await fetch(`/api/master/rek6?q=${inputValue}&limit=1000&startsWith=5`);
    const d = await res.json();
    return (d.data || []).map((r: any) => ({
      value: r.kd_rek6,
      label: `${r.kd_rek6} - ${r.nm_rek6}`,
      raw: r
    }));
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setEditForm({
      volume: item.volume?.toString() || "0",
      harga: item.nilai?.toString() || "0",
      kd_rek6: item.kd_rek6 || "",
      nm_rek6: item.nm_rek6 || "",
      uraian: item.uraian || "",
      satuan: item.satuan || ""
    });
    setShowEditModal(true);
  };

  const openAddModal = async () => {
    try {
      const res = await fetch(`/api/perencanaan/rba/${no_rba}/puk-rincian`);
      const d = await res.json();
      if (d.data) {
        setPukOptions(d.data.map((r: any) => ({
          value: r.id || r.uraian,
          label: r.uraian || "(Tanpa Uraian)",
          raw: r
        })));
      }
      setAddForm({ volume: "", harga: "", kd_rek6: "", nm_rek6: "", uraian: "", satuan: "" });
      setShowAddModal(true);
    } catch (e) {
      console.error(e);
      Swal.fire({ icon: "error", title: "Error", text: "Gagal mengambil data PUK" });
    }
  };

  const saveAdd = async () => {
    if (!addForm.uraian) {
      Swal.fire({ icon: "warning", title: "Peringatan", text: "Silakan pilih uraian rincian dari PUK terlebih dahulu" });
      return;
    }
    setSavingAdd(true);
    try {
      const res = await fetch(`/api/perencanaan/rba/${no_rba}/rincian`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kd_rek6: addForm.kd_rek6,
          nm_rek6: addForm.nm_rek6,
          uraian: addForm.uraian,
          volume: Number(addForm.volume || 0),
          satuan: addForm.satuan,
          harga: Number(addForm.harga || 0)
        })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);

      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Rincian berhasil ditambahkan",
        timer: 1500,
        showConfirmButton: false
      });
      setShowAddModal(false);
      loadData();
    } catch (e: any) {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: e.message || "Gagal menambahkan rincian"
      });
    } finally {
      setSavingAdd(false);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowEditModal(false);
  };

  const saveEdit = async () => {
    if (!editForm.kd_rek6) {
      Swal.fire({
        icon: "warning",
        title: "Peringatan",
        text: "Kode Rekening Belanja harus dipilih sebelum menyimpan.",
        confirmButtonColor: "#3B82F6",
      });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/perencanaan/rba/${no_rba}/rincian`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rincian_id: editingId,
          volume: Number(editForm.volume),
          harga: Number(editForm.harga),
          kd_rek6: editForm.kd_rek6,
          nm_rek6: editForm.nm_rek6
        })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);

      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Data rincian telah diperbarui.",
        timer: 1500,
        showConfirmButton: false
      });

      setEditingId(null);
      setShowEditModal(false);
      loadData();
    } catch (e: any) {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: e.message || "Gagal menyimpan rincian",
        confirmButtonColor: "#EF4444"
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteRincian = async (item: any) => {
    const result = await Swal.fire({
      title: "Hapus Rincian?",
      text: `Anda yakin ingin menghapus rincian "${item.uraian}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#64748B",
      confirmButtonText: "Ya, Hapus!",
      cancelButtonText: "Batal",
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`/api/perencanaan/rba/${no_rba}/rincian?rincian_id=${item.id}`, {
          method: "DELETE",
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error);

        Swal.fire({
          icon: "success",
          title: "Terhapus",
          text: "Rincian telah dihapus",
          timer: 1500,
          showConfirmButton: false
        });
        loadData();
      } catch (e: any) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: e.message || "Gagal menghapus rincian",
        });
      }
    }
  };

  if (loading) return <div className="p-8 text-center">Memuat...</div>;
  if (!rba) return <div className="p-8 text-center text-red-500">RBA tidak ditemukan</div>;

  const formInputStyle = { width: "100%", fontSize: 13, borderRadius: 4, border: "1px solid #E2E8F0", padding: "6px 8px" };

  // Group rincian by kd_rek6
  const groupedRincian = (rba.rincian || []).reduce((acc: any, item: any) => {
    const rek = item.kd_rek6 || "BELUM_DIATUR";
    if (!acc[rek]) {
      acc[rek] = {
        kd_rek6: item.kd_rek6,
        nm_rek6: item.nm_rek6,
        items: [],
        totalGroup: 0
      };
    }
    acc[rek].items.push(item);
    acc[rek].totalGroup += Number(item.total || 0);
    return acc;
  }, {});

  const grandTotal = Object.values(groupedRincian).reduce((sum: number, group: any) => sum + group.totalGroup, 0);

  const handleBack = async () => {
    const hasEmptyRekening = (rba.rincian || []).some((item: any) => !item.kd_rek6);
    if (hasEmptyRekening) {
      const result = await Swal.fire({
        title: "Data Belum Lengkap",
        text: "Masih ada rincian yang belum memiliki Kode Rekening Belanja. Jika Anda tetap kembali, seluruh data RBA ini akan dibatalkan/dihapus. Lanjutkan?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#EF4444",
        cancelButtonColor: "#64748B",
        confirmButtonText: "Ya, Hapus RBA",
        cancelButtonText: "Batal, Saya Akan Isi",
      });

      if (result.isConfirmed) {
        try {
          const res = await fetch(`/api/perencanaan/rba/${no_rba}`, { method: "DELETE" });
          if (!res.ok) throw new Error("Gagal menghapus RBA");

          Swal.fire({
            icon: "success",
            title: "Dibatalkan",
            text: "Data RBA telah dihapus",
            timer: 1500,
            showConfirmButton: false
          });

          router.push("/dashboard/perencanaan/rba");
        } catch (e: any) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: e.message,
          });
        }
      }
    } else {
      router.push("/dashboard/perencanaan/rba");
    }
  };

  return (
    <div className="animate-fadein relative pb-10">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>Rincian Rencana Bisnis dan Anggaran</h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-outline" onClick={handleBack}>
            <ArrowLeft size={16} /> Kembali
          </button>
        </div>
      </div>

      <div className="card mb-10" style={{ padding: 0, overflow: "hidden", background: "#fff", border: "1px solid #E2E8F0", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)" }}>
        <div style={{ background: "linear-gradient(to right, #1E293B, #0F172A)", color: "white", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 13, color: "#94A3B8", marginBottom: 4 }}>No. RBA: {rba.no_rba}</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#F8FAFC" }}>{rba.kdSubKegiatan ? `${rba.kdSubKegiatan} - ${rba.nmSubKegiatan || "-"}` : rba.nmSubKegiatan || "-"}</h2>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, color: "#94A3B8", marginBottom: 4 }}>Total Anggaran</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#38BDF8", letterSpacing: "-0.5px" }}>
              Rp {new Intl.NumberFormat('id-ID').format(grandTotal || 0)}
            </div>
          </div>
        </div>

        <div style={{ padding: 24 }}>
          <div style={{ display: "grid", gridTemplateColumns: "220px 10px 1fr", gap: "8px 0", fontSize: 13, color: "#334155", marginBottom: 24 }}>
            <div>Upaya Kesehatan</div>
            <div>:</div>
            <div>{rba.kdUkm ? `${rba.kdUkm} - ${rba.nmUkm}` : rba.nmUkm || "-"}</div>

            <div>Peruntukan</div>
            <div>:</div>
            <div>{rba.kdPeruntukan ? `${rba.kdPeruntukan} - ${rba.nmPeruntukan}` : rba.nmPeruntukan || "-"}</div>

            <div>Komponen</div>
            <div>:</div>
            <div>{rba.kdKomponen ? `${rba.kdKomponen} - ${rba.nmKomponen}` : rba.nmKomponen || "-"}</div>

            <div>Sub Komponen</div>
            <div>:</div>
            <div>{rba.kdRincian ? `${rba.kdRincian} - ${rba.nmRincian}` : rba.nmRincian || "-"}</div>

            <div style={{ gridColumn: "1 / -1", height: 16 }}></div>

            <div>Program</div>
            <div>:</div>
            <div>{rba.kdProgram ? `${rba.kdProgram} - ${rba.nmProgram}` : rba.nmProgram || "-"}</div>

            <div>Kegiatan</div>
            <div>:</div>
            <div>{rba.kdKegiatan ? `${rba.kdKegiatan} - ${rba.nmKegiatan}` : rba.nmKegiatan || "-"}</div>

            <div>Sub Kegiatan</div>
            <div>:</div>
            <div>{rba.kdSubKegiatan ? `${rba.kdSubKegiatan} - ${rba.nmSubKegiatan}` : rba.nmSubKegiatan || "-"}</div>

            <div>Jenis Pelayanan Dasar (SPM)</div>
            <div>:</div>
            <div>{rba.kdSpm ? `${rba.kdSpm} - ${rba.nmSpm}` : rba.nmSpm || "-"}</div>
          </div>

          <div style={{ padding: 16, background: "#F8FAFC", borderRadius: 8, border: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0F172A", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
                Detail Operasional
              </h3>
              <button className="btn btn-outline btn-sm" onClick={() => alert("Fitur edit info segera hadir")} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                <Edit2 size={14} /> Ubah Info
              </button>
            </div>
            <div className="tbl-wrap" style={{ borderRadius: 8, marginTop: 12 }}>
              <table className="tbl">
                <tbody>
                  <tr>
                    <td style={{ width: '25%', fontWeight: 600, color: '#64748B', fontSize: 13 }}>Tujuan</td>
                    <td style={{ fontSize: 14, color: '#1E293B' }}>{rba.tujuan || "-"}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, color: '#64748B', fontSize: 13 }}>Sasaran</td>
                    <td style={{ fontSize: 14, color: '#1E293B' }}>{rba.sasaran || "-"}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, color: '#64748B', fontSize: 13 }}>Target Sasaran</td>
                    <td style={{ fontSize: 14, color: '#1E293B' }}>{rba.target_sasaran || rba.targetSasaran || "-"}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, color: '#64748B', fontSize: 13 }}>Target Objek</td>
                    <td style={{ fontSize: 14, color: '#1E293B' }}>{rba.target_objek || rba.targetObjek || "-"}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, color: '#64748B', fontSize: 13 }}>Lokasi</td>
                    <td style={{ fontSize: 14, color: '#1E293B' }}>{rba.lokasi || "-"}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, color: '#64748B', fontSize: 13 }}>Penanggung Jawab</td>
                    <td style={{ fontSize: 14, color: '#1E293B' }}>{rba.penanggungjawab || "-"}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 600, color: '#64748B', fontSize: 13 }}>Sumber Dana</td>
                    <td style={{ fontSize: 14, color: '#1E293B' }}>{rba.sumdan || "-"}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ height: 1, background: "#E2E8F0", margin: "32px 0 24px 0" }}></div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", margin: 0 }}>Daftar Rincian Anggaran</h3>
            <button className="btn btn-primary btn-sm" onClick={openAddModal}>
              <Plus size={16} /> Tambah Rincian
            </button>
          </div>

          <div className="tbl-wrap" style={{ borderRadius: 0 }}>
            <table className="tbl" style={{ minWidth: 1000 }}>
              <thead>
                <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "2px solid #E2E8F0" }}>
                  <th style={{ width: 200, color: "#334155", fontSize: 12 }}>KODE REKENING</th>
                  <th style={{ color: "#334155", fontSize: 12 }}>URAIAN</th>
                  <th style={{ width: 100, textAlign: "center", color: "#334155", fontSize: 12 }}>VOLUME</th>
                  <th style={{ width: 120, textAlign: "center", color: "#334155", fontSize: 12 }}>SATUAN</th>
                  <th style={{ width: 150, textAlign: "right", color: "#334155", fontSize: 12 }}>HARGA SATUAN</th>
                  <th style={{ width: 150, textAlign: "right", color: "#334155", fontSize: 12 }}>TOTAL</th>
                  <th style={{ width: 100, textAlign: "center", color: "#334155", fontSize: 12 }}>AKSI</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(groupedRincian).length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: 32, color: "#64748B" }}>
                      Belum ada rincian.
                    </td>
                  </tr>
                ) : (
                  Object.values(groupedRincian).map((group: any) => (
                    <React.Fragment key={group.kd_rek6}>
                      {/* Parent Row (Group by kd_rek6) */}
                      <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                        <td style={{ fontWeight: 700, fontSize: 13, color: "#0F172A" }}>{group.kd_rek6 === "BELUM_DIATUR" ? "" : group.kd_rek6}</td>
                        <td style={{ fontWeight: 700, fontSize: 13, color: "#0F172A" }}>{group.kd_rek6 === "BELUM_DIATUR" ? "Belum Diatur Kode Rekening" : group.nm_rek6}</td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td style={{ textAlign: "right", fontWeight: 700, fontSize: 13, color: "#0F172A" }}>
                          {new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2 }).format(group.totalGroup)}
                        </td>
                        <td></td>
                      </tr>

                      {/* Child Rows */}
                      {group.items.map((item: any, i: number) => (
                        <tr key={item.id.toString()} style={{ borderBottom: "1px solid #E2E8F0" }}>
                          <td></td>
                          <td style={{ fontSize: 13, paddingLeft: 32, color: "#334155" }}>
                            <div style={{ display: "flex", gap: 8 }}>
                              <span style={{ color: "#94A3B8" }}>{i + 1}.</span>
                              <span>{item.uraian}</span>
                            </div>
                          </td>
                          <td style={{ textAlign: "center", fontSize: 13, color: "#334155" }}>{new Intl.NumberFormat('id-ID').format(item.volume || 0)}</td>
                          <td style={{ textAlign: "center", fontSize: 13, color: "#334155" }}>{item.satuan}</td>
                          <td style={{ textAlign: "right", fontSize: 13, color: "#334155" }}>{new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2 }).format(item.nilai || 0)}</td>
                          <td style={{ textAlign: "right", fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2 }).format(item.total || 0)}</td>
                          <td style={{ textAlign: "center" }}>
                            <div style={{ display: "flex", gap: 5, justifyContent: "center" }}>
                              <button className="btn btn-sm" style={{ background: "#E0F2FE", color: "#0284C7", borderColor: "#BAE6FD" }} onClick={() => startEdit(item)} title="Edit">
                                <Edit2 size={12} />
                              </button>
                              <button className="btn btn-sm" style={{ background: "#FEE2E2", color: "#DC2626", borderColor: "#FECACA" }} onClick={() => deleteRincian(item)} title="Hapus">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))
                )}
              </tbody>
              <tfoot style={{ background: "#F8FAFC" }}>
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", fontWeight: 700, fontSize: 13, color: "#0F172A", padding: "12px 16px" }}>
                    Jumlah Total :
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 800, fontSize: 14, color: "#38BDF8", padding: "12px 16px" }}>
                    Rp {new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2 }).format(grandTotal)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {showEditModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#FFF", borderRadius: 8, padding: 24, width: 600, maxWidth: "100%", boxShadow: "0 10px 25px rgba(0,0,0,0.1)" }}>
            <h3 style={{ margin: "0 0 16px 0", fontSize: 18, color: "#0F172A", fontWeight: 700 }}>Edit Rincian RBA</h3>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Uraian (Read Only)</label>
              <textarea
                style={{ ...formInputStyle, backgroundColor: "#F1F5F9", resize: "none" }}
                rows={2}
                value={editForm.uraian}
                readOnly
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Kode Rekening Belanja</label>
              <AsyncSelect
                cacheOptions
                defaultOptions
                loadOptions={loadRek6Options}
                onChange={(v: any) => setEditForm(prev => ({ ...prev, kd_rek6: v.value, nm_rek6: v.raw.nm_rek6 }))}
                value={editForm.kd_rek6 ? { value: editForm.kd_rek6, label: `${editForm.kd_rek6} - ${editForm.nm_rek6}` } : null}
                styles={{ control: (base) => ({ ...base, fontSize: 13, minHeight: 38 }) }}
                placeholder="Pilih Rekening Belanja..."
              />
            </div>

            <div style={{ display: "flex", gap: 16, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Volume</label>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <input
                    type="number"
                    style={{ ...formInputStyle, borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
                    value={editForm.volume}
                    onChange={e => setEditForm(prev => ({ ...prev, volume: e.target.value }))}
                  />
                  <div style={{ padding: "6px 12px", backgroundColor: "#F1F5F9", border: "1px solid #E2E8F0", borderLeft: 0, borderTopRightRadius: 4, borderBottomRightRadius: 4, fontSize: 13, color: "#64748B" }}>
                    {editForm.satuan}
                  </div>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Harga Satuan (Rp)</label>
                <input
                  type="number"
                  style={{ ...formInputStyle }}
                  value={editForm.harga}
                  onChange={e => setEditForm(prev => ({ ...prev, harga: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ marginBottom: 24, padding: "12px 16px", backgroundColor: "#F0F9FF", borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, color: "#0369A1", fontWeight: 600 }}>Total Estimasi:</span>
              <span style={{ fontSize: 16, color: "#0C4A6E", fontWeight: 700 }}>Rp {new Intl.NumberFormat('id-ID').format(Number(editForm.volume) * Number(editForm.harga))}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button className="btn btn-outline" onClick={cancelEdit} disabled={saving}>Batal</button>
              <button className="btn btn-primary" onClick={saveEdit} disabled={saving || !editForm.kd_rek6}>
                {saving ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Rincian */}
      {showAddModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ backgroundColor: "#fff", width: "100%", maxWidth: 600, borderRadius: 12, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)", overflow: "hidden" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", margin: 0 }}>Tambah Rincian RBA</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748B" }}>✕</button>
            </div>

            <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Uraian Rincian (dari PUK)</label>
                <Select
                  options={pukOptions}
                  placeholder="Pilih Uraian..."
                  isClearable
                  onChange={(option) => {
                    if (option) {
                      setAddForm({
                        ...addForm,
                        uraian: option.raw.uraian || "",
                        kd_rek6: option.raw.kd_rek6 || option.raw.kode || "",
                        nm_rek6: option.raw.nm_rek6 || "",
                        volume: (option.raw.volume || 0).toString(),
                        satuan: option.raw.satuan || "",
                        harga: (option.raw.harga || option.raw.nilai || 0).toString()
                      });
                    } else {
                      setAddForm({ volume: "", harga: "", kd_rek6: "", nm_rek6: "", uraian: "", satuan: "" });
                    }
                  }}
                  styles={{
                    control: (base) => ({ ...base, fontSize: 13, borderRadius: 4, borderColor: "#E2E8F0" }),
                    menu: (base) => ({ ...base, fontSize: 13 })
                  }}
                  noOptionsMessage={() => "Tidak ada rincian PUK yang tersedia"}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Kode Rekening</label>
                <input
                  type="text"
                  value={addForm.kd_rek6 ? `${addForm.kd_rek6} - ${addForm.nm_rek6}` : ""}
                  readOnly
                  style={{ ...formInputStyle, backgroundColor: "#F1F5F9", color: "#64748B", cursor: "not-allowed" }}
                  placeholder="Terisi otomatis"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Volume</label>
                  <input
                    type="number"
                    value={addForm.volume}
                    readOnly
                    style={{ ...formInputStyle, backgroundColor: "#F1F5F9", color: "#64748B", cursor: "not-allowed" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Satuan</label>
                  <input
                    type="text"
                    value={addForm.satuan}
                    readOnly
                    style={{ ...formInputStyle, backgroundColor: "#F1F5F9", color: "#64748B", cursor: "not-allowed" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>Harga Satuan (Rp)</label>
                <input
                  type="number"
                  value={addForm.harga}
                  readOnly
                  style={{ ...formInputStyle, backgroundColor: "#F1F5F9", color: "#64748B", cursor: "not-allowed" }}
                />
              </div>

            </div>

            <div style={{ padding: "16px 24px", borderTop: "1px solid #E2E8F0", display: "flex", justifyContent: "flex-end", gap: 12, backgroundColor: "#F8FAFC" }}>
              <button className="btn btn-outline" onClick={() => setShowAddModal(false)} disabled={savingAdd}>
                Batal
              </button>
              <button className="btn btn-primary" onClick={saveAdd} disabled={savingAdd || !addForm.uraian}>
                {savingAdd ? "Menyimpan..." : "Simpan Rincian"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
