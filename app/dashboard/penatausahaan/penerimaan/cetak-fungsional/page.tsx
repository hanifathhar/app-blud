"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function formatNumber(val: number) {
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
}

export default function CetakFungsionalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<any[]>([]);
  const [uptInfo, setUptInfo] = useState<any>(null);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCetak = async () => {
      try {
        const query = new URLSearchParams();
        const kd_upt = searchParams.get("kd_upt");
        const b = searchParams.get("bulan");
        const t = searchParams.get("tahun");
        
        if (kd_upt) query.append("kd_upt", kd_upt);
        if (b) query.append("bulan", b);
        if (t) query.append("tahun", t);

        const res = await fetch(`/api/penatausahaan/penerimaan/cetak-fungsional?${query.toString()}`);
        const result = await res.json();

        if (res.ok) {
          setData(result.data || []);
          setUptInfo(result.upt);
          setMeta({ tahun: result.tahun, bulan: result.bulan });
          
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

  const months = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];
  const bulanText = meta?.bulan ? months[parseInt(meta.bulan) - 1] : "";
  const headerBulanText = parseInt(meta?.bulan || "1") > 1 
    ? `KEADAAN BULAN JANUARI S/d. BULAN ${bulanText}`
    : `KEADAAN BULAN JANUARI`;

  let totalAnggaran = 0;
  let totalSdBulanLalu = 0;
  let totalBulanIni = 0;
  let totalSdBulanIni = 0;

  // Totals can be summed from level 3, or we can just pick level 3 items and sum them
  data.forEach(row => {
    if (row.level === 3) {
      totalAnggaran += row.anggaran;
      totalSdBulanLalu += row.realisasiBulanLalu;
      totalBulanIni += row.realisasiBulanIni;
      totalSdBulanIni += row.realisasiSdHariIni;
    }
  });

  const totalLebihKurang = totalSdBulanIni - totalAnggaran;
  const totalPersentase = totalAnggaran > 0 ? (totalSdBulanIni / totalAnggaran) * 100 : 0;

  return (
    <div style={{ backgroundColor: "white", color: "black", minHeight: "100vh", padding: "1rem" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @page { size: landscape; margin: 10mm; }
        body { background: white; margin: 0; font-family: 'Times New Roman', Times, serif; font-size: 11px; }
        * { box-sizing: border-box; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid black; padding: 4px; vertical-align: top; }
        th { text-align: center; font-weight: bold; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        @media print {
          html, body { height: 100vh; overflow: visible; }
          .no-print { display: none !important; }
        }
      `}} />

      {/* Control Buttons (No Print) */}
      <div className="no-print" style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        <button onClick={() => window.print()} style={{ padding: "8px 16px", background: "#2563eb", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Print Laporan</button>
        <button onClick={() => router.back()} style={{ padding: "8px 16px", background: "#e2e8f0", color: "black", border: "none", borderRadius: "4px", cursor: "pointer" }}>Kembali</button>
      </div>

      <div style={{ textAlign: "center", marginBottom: "2rem", fontWeight: "bold" }}>
        <div style={{ fontSize: "14px" }}>PEMERINTAH KABUPATEN TAPANULI SELATAN</div>
        <div style={{ fontSize: "14px" }}>LAPORAN PERTANGGUNGJAWABAN PENERIMAAN</div>
        <div style={{ fontSize: "12px" }}>{headerBulanText}</div>
        <div style={{ fontSize: "12px" }}>TAHUN ANGGARAN {meta?.tahun}</div>
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <table style={{ border: "none", width: "auto" }}>
          <tbody>
            <tr>
              <td style={{ border: "none", padding: 0, width: "150px" }}>Nama SKPD</td>
              <td style={{ border: "none", padding: 0, width: "10px" }}>:</td>
              <td style={{ border: "none", padding: 0, fontWeight: "bold" }}>{uptInfo?.kd_upt || ""} - {uptInfo?.nm_upt || "Semua UPT"}</td>
            </tr>
            <tr>
              <td style={{ border: "none", padding: 0 }}>Pengguna Anggaran/Barang</td>
              <td style={{ border: "none", padding: 0 }}>:</td>
              <td style={{ border: "none", padding: 0 }}></td>
            </tr>
            <tr>
              <td style={{ border: "none", padding: 0 }}>Bendahara Penerimaan</td>
              <td style={{ border: "none", padding: 0 }}>:</td>
              <td style={{ border: "none", padding: 0 }}></td>
            </tr>
          </tbody>
        </table>
      </div>

      <table>
        <thead>
          <tr>
            <th rowSpan={2} style={{ width: "10%" }}>Kode</th>
            <th rowSpan={2} style={{ width: "30%" }}>Nama Rekening</th>
            <th rowSpan={2} style={{ width: "12%" }}>Anggaran (Rp.)</th>
            <th colSpan={3}>Realisasi Penerimaan (Rp.)</th>
            <th rowSpan={2} style={{ width: "6%" }}>%</th>
            <th rowSpan={2} style={{ width: "12%" }}>Lebih/Kurang</th>
          </tr>
          <tr>
            <th style={{ width: "10%" }}>S/d Bulan lalu</th>
            <th style={{ width: "10%" }}>Bulan Ini</th>
            <th style={{ width: "10%" }}>S/d Bulan Ini</th>
          </tr>
          <tr style={{ backgroundColor: "#f9fafb" }}>
            <th style={{ fontStyle: "italic", fontWeight: "normal", fontSize: "10px" }}>1</th>
            <th style={{ fontStyle: "italic", fontWeight: "normal", fontSize: "10px" }}>2</th>
            <th style={{ fontStyle: "italic", fontWeight: "normal", fontSize: "10px" }}>3</th>
            <th style={{ fontStyle: "italic", fontWeight: "normal", fontSize: "10px" }}>4</th>
            <th style={{ fontStyle: "italic", fontWeight: "normal", fontSize: "10px" }}>5</th>
            <th style={{ fontStyle: "italic", fontWeight: "normal", fontSize: "10px" }}>6=(4+5)</th>
            <th style={{ fontStyle: "italic", fontWeight: "normal", fontSize: "10px" }}>7</th>
            <th style={{ fontStyle: "italic", fontWeight: "normal", fontSize: "10px" }}>8=(6-3)</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => {
            const isBold = row.level <= 4; // Bold up to level 4 as per image
            const lebihKurang = row.realisasiSdHariIni - row.anggaran;
            const persentase = row.anggaran > 0 ? (row.realisasiSdHariIni / row.anggaran) * 100 : 0;
            
            return (
              <tr key={idx} style={{ fontWeight: isBold ? "bold" : "normal" }}>
                <td>{row.kode}</td>
                <td>{row.nama}</td>
                <td className="text-right">{formatNumber(row.anggaran)}</td>
                <td className="text-right">{formatNumber(row.realisasiBulanLalu)}</td>
                <td className="text-right">{formatNumber(row.realisasiBulanIni)}</td>
                <td className="text-right">{formatNumber(row.realisasiSdHariIni)}</td>
                <td className="text-center">{persentase.toFixed(2)}</td>
                <td className="text-right">{formatNumber(lebihKurang)}</td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr style={{ fontWeight: "bold" }}>
            <td colSpan={2} className="text-center">Jumlah Total (Rp.)</td>
            <td className="text-right">{formatNumber(totalAnggaran)}</td>
            <td className="text-right">{formatNumber(totalSdBulanLalu)}</td>
            <td className="text-right">{formatNumber(totalBulanIni)}</td>
            <td className="text-right">{formatNumber(totalSdBulanIni)}</td>
            <td className="text-center">{totalPersentase.toFixed(2)}</td>
            <td className="text-right">{formatNumber(totalLebihKurang)}</td>
          </tr>
        </tfoot>
      </table>

      <div style={{ marginTop: "40px", display: "flex", justifyContent: "space-between", pageBreakInside: "avoid" }}>
        <div style={{ textAlign: "center", width: "40%" }}>
          <p>Mengetahui,</p>
          <p style={{ fontWeight: "bold" }}>Plt. KEPALA UPT {uptInfo?.nm_upt?.toUpperCase() || ""}</p>
          <br /><br /><br /><br />
          <p style={{ fontWeight: "bold", textDecoration: "underline", marginBottom: 0 }}>(..........................................................)</p>
          <p style={{ marginTop: "2px" }}>NIP. ........................................</p>
        </div>
        <div style={{ textAlign: "center", width: "40%" }}>
          <p>SIPROK, ........................ {meta?.tahun}</p>
          <p style={{ fontWeight: "bold" }}>BENDAHARA PENERIMA PEMBANTU</p>
          <br /><br /><br /><br />
          <p style={{ fontWeight: "bold", textDecoration: "underline", marginBottom: 0 }}>(..........................................................)</p>
          <p style={{ marginTop: "2px" }}>NIP. ........................................</p>
        </div>
      </div>
    </div>
  );
}
