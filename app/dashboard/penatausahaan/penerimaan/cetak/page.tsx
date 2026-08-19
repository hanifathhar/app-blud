"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function formatRupiah(val: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
}

export default function CetakPenerimaanPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCetak = async () => {
      try {
        const query = new URLSearchParams();
        const mode = searchParams.get("mode");
        const kd_upt = searchParams.get("kd_upt");
        
        if (mode) query.append("mode", mode);
        if (kd_upt) query.append("kd_upt", kd_upt);

        if (mode === "bulan") {
          const b = searchParams.get("bulan");
          const t = searchParams.get("tahun");
          if (b) query.append("bulan", b);
          if (t) query.append("tahun", t);
        } else {
          const ta = searchParams.get("tgl_awal");
          const tk = searchParams.get("tgl_akhir");
          if (ta) query.append("tgl_awal", ta);
          if (tk) query.append("tgl_akhir", tk);
        }

        const res = await fetch(`/api/penatausahaan/penerimaan/cetak?${query.toString()}`);
        const result = await res.json();

        if (res.ok) {
          setData(result);
          // Tunggu render selesai baru print
          setTimeout(() => {
            window.print();
          }, 1000);
        } else {
          setError(result.message || "Gagal mengambil data");
        }
      } catch (err) {
        setError("Terjadi kesalahan jaringan");
      } finally {
        setLoading(false);
      }
    };
    fetchCetak();
  }, [searchParams]);

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Memuat dokumen cetak...</div>;
  if (error) return <div style={{ padding: 40, textAlign: "center", color: "red" }}>{error}</div>;
  if (!data) return null;

  const { data: listRaw, upt, params } = data;
  let periodeText = "";
  if (params.mode === "bulan") {
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    periodeText = `Bulan ${months[parseInt(params.bulan) - 1]} ${params.tahun}`;
  } else {
    const dStart = new Date(params.tgl_awal).toLocaleDateString("id-ID");
    const dEnd = new Date(params.tgl_akhir).toLocaleDateString("id-ID");
    periodeText = `Tanggal ${dStart} s/d ${dEnd}`;
  }

  // Calculate Grand Total
  const grandTotal = listRaw.reduce((sum: number, item: any) => sum + (Number(item.nilai) || 0), 0);

  // Tanggal Hari Ini untuk Tanda Tangan
  const today = new Date();
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const ttdDate = `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;

  return (
    <div style={{ backgroundColor: "white", color: "black", padding: "2cm", fontFamily: "Arial, sans-serif", fontSize: "12px", maxWidth: "100%", margin: "0 auto" }}>
      <style>{`
        @media print {
          @page { size: landscape; margin: 1cm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background: white; }
          .no-print { display: none !important; }
        }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; margin-bottom: 20px; }
        th, td { border: 1px solid black; padding: 6px 8px; text-align: left; vertical-align: top; }
        th { background-color: #f3f4f6; font-weight: bold; text-align: center; }
        .text-right { text-align: right !important; }
        .text-center { text-align: center !important; }
        .header-title { text-align: center; margin-bottom: 30px; }
        .header-title h2 { margin: 0 0 5px 0; font-size: 16px; font-weight: bold; }
        .header-title h3 { margin: 0; font-size: 14px; font-weight: normal; }
        .ttd-container { display: flex; justify-content: space-between; margin-top: 50px; padding: 0 50px; page-break-inside: avoid; }
        .ttd-box { width: 250px; text-align: center; }
        .ttd-space { height: 80px; }
      `}</style>

      {/* Control Buttons (No Print) */}
      <div className="no-print" style={{ marginBottom: 20, display: "flex", gap: 10 }}>
        <button onClick={() => window.print()} style={{ padding: "8px 16px", background: "#2563eb", color: "white", border: "none", borderRadius: 4, cursor: "pointer" }}>Print Laporan</button>
        <button onClick={() => router.back()} style={{ padding: "8px 16px", background: "#e2e8f0", color: "black", border: "none", borderRadius: 4, cursor: "pointer" }}>Kembali</button>
      </div>

      <div className="header-title">
        <h2>BUKU REGISTER PENERIMAAN</h2>
        <h2>{upt?.nm_upt || "SEMUA UPT"}</h2>
        <h3>Periode: {periodeText}</h3>
      </div>

      <table>
        <thead>
          <tr>
            <th style={{ width: "4%" }}>No</th>
            <th style={{ width: "10%" }}>Tanggal</th>
            <th style={{ width: "15%" }}>No. Bukti</th>
            <th style={{ width: "25%" }}>Uraian</th>
            <th style={{ width: "15%" }}>Penyetor</th>
            <th style={{ width: "16%" }}>Rekening</th>
            <th style={{ width: "15%" }}>Jumlah (Rp)</th>
          </tr>
        </thead>
        <tbody>
          {listRaw.length === 0 ? (
            <tr>
              <td colSpan={7} className="text-center" style={{ padding: "20px" }}>Tidak ada data penerimaan pada periode ini.</td>
            </tr>
          ) : (
            listRaw.map((item: any, idx: number) => (
              <tr key={item.idTerima}>
                <td className="text-center">{idx + 1}</td>
                <td className="text-center">{item.tglBukti ? new Date(item.tglBukti).toLocaleDateString("id-ID") : "-"}</td>
                <td>{item.noBukti || "-"}</td>
                <td>{item.keterangan || "-"}</td>
                <td>{item.nmPenyetor || "-"}</td>
                <td>{item.kdRek6} - {item.nmRek6}</td>
                <td className="text-right">{formatRupiah(item.nilai || 0)}</td>
              </tr>
            ))
          )}
        </tbody>
        <tfoot>
          <tr>
            <th colSpan={6} className="text-right" style={{ fontSize: "13px" }}>TOTAL PENERIMAAN</th>
            <th className="text-right" style={{ fontSize: "13px" }}>{formatRupiah(grandTotal)}</th>
          </tr>
        </tfoot>
      </table>

      {/* Block Tanda Tangan */}
      <div className="ttd-container">
        <div className="ttd-box">
          <p style={{ marginBottom: 5 }}>Mengetahui,</p>
          <p style={{ fontWeight: "bold" }}>Kepala UPT / Pimpinan</p>
          <div className="ttd-space"></div>
          <p style={{ fontWeight: "bold", textDecoration: "underline" }}>( ........................................ )</p>
          <p>NIP. ...................................</p>
        </div>
        <div className="ttd-box">
          <p style={{ marginBottom: 5 }}>..............., {ttdDate}</p>
          <p style={{ fontWeight: "bold" }}>Bendahara Penerimaan</p>
          <div className="ttd-space"></div>
          <p style={{ fontWeight: "bold", textDecoration: "underline" }}>( ........................................ )</p>
          <p>NIP. ...................................</p>
        </div>
      </div>
    </div>
  );
}
