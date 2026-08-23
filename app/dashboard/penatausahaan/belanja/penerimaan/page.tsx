"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

function formatRupiah(val: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
}

export default function PenerimaanBarangPage() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    fetch("/api/penatausahaan/belanja/penerimaan")
      .then((r) => r.json())
      .then((d) => {
        setList(d.data || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="animate-fadein">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>📦 Penerimaan Barang/Jasa</h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>Kelola Berita Acara Serah Terima (BAST)</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/dashboard/penatausahaan/belanja/penerimaan/tambah">
            <button className="btn btn-primary">
              <Plus size={16} /> Tambah BAST
            </button>
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="tbl-wrap" style={{ marginTop: 20 }}>
          <table className="tbl">
            <thead>
              <tr>
                <th style={{ width: 40, textAlign: "center" }}>No</th>
                <th>No. BAST</th>
                <th>Tgl BAST</th>
                <th>Vendor</th>
                <th>Uraian BAST</th>
                <th style={{ textAlign: "right" }}>Nilai (Rp)</th>
                <th style={{ textAlign: "center" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center p-6 text-gray-500"><div className="loading-spinner" style={{ margin: "0 auto" }} /></td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={7} className="text-center p-6 text-gray-500">Belum ada data penerimaan BAST</td></tr>
              ) : (
                list.map((item, idx) => (
                  <tr key={item.id}>
                    <td style={{ textAlign: "center" }}>{idx + 1}</td>
                    <td style={{ fontWeight: 600, color: "#2563EB" }}>{item.no_bast || "-"}</td>
                    <td>{item.tgl_bast ? new Date(item.tgl_bast).toLocaleDateString("id-ID") : "-"}</td>
                    <td>{item.nm_vendor || "-"}</td>
                    <td>{item.uraian || "-"}</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>{formatRupiah(item.nilai_bast || 0)}</td>
                    <td style={{ textAlign: "center" }}>
                      <span className="badge" style={{ backgroundColor: "#dcfce7", color: "#166534" }}>
                         {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
