"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

function formatRupiah(val: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
}

export default function TagihanPage() {
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    fetch("/api/penatausahaan/belanja/tagihan")
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
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>🧾 Tagihan (Invoice)</h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 2 }}>Kelola Tagihan masuk untuk dibayarkan</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/dashboard/penatausahaan/belanja/tagihan/tambah">
            <button className="btn btn-primary">
              <Plus size={16} /> Tambah Tagihan
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
                <th>No. Tagihan</th>
                <th>Tgl Tagihan</th>
                <th>Vendor</th>
                <th>Uraian</th>
                <th style={{ textAlign: "right" }}>Nilai (Rp)</th>
                <th style={{ textAlign: "center" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center p-6 text-gray-500"><div className="loading-spinner" style={{ margin: "0 auto" }} /></td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={7} className="text-center p-6 text-gray-500">Belum ada data tagihan</td></tr>
              ) : (
                list.map((item, idx) => (
                  <tr key={item.id}>
                    <td style={{ textAlign: "center" }}>{idx + 1}</td>
                    <td style={{ fontWeight: 600, color: "#2563EB" }}>{item.no_tagihan || "-"}</td>
                    <td>{item.tgl_tagihan ? new Date(item.tgl_tagihan).toLocaleDateString("id-ID") : "-"}</td>
                    <td>{item.nm_vendor || "-"}</td>
                    <td>{item.uraian || "-"}</td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>{formatRupiah(item.nilai_tagihan || 0)}</td>
                    <td style={{ textAlign: "center" }}>
                      <span className="badge" style={{ backgroundColor: "#fef3c7", color: "#92400e" }}>
                         {item.status.replace("_", " ")}
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
