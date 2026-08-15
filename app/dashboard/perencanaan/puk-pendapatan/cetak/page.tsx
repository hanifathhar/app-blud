"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function CetakPukPage() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCetak = async () => {
      try {
        const query = new URLSearchParams();
        const tahun = searchParams.get("tahun");
        const kd_upt = searchParams.get("kd_upt");

        if (tahun) query.append("tahun", tahun);
        if (kd_upt) query.append("kd_upt", kd_upt);

        const res = await fetch(`/api/perencanaan/puk-pendapatan/cetak?${query.toString()}`);
        const result = await res.json();

        if (res.ok) {
          setData(result);
          setTimeout(() => {
            window.print();
          }, 1000);
        } else {
          setError(result.error || "Gagal mengambil data");
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

  const { upt, data: listRaw, tahun } = data;
  const printDateStr = searchParams.get("tgl") || "";

  let formattedPrintDate = printDateStr;
  if (printDateStr) {
    const d = new Date(printDateStr);
    if (!isNaN(d.getTime())) {
      const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      formattedPrintDate = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }
  }

  const formatRp = (num: number) => {
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
  };

  let grandTotal = 0;
  let rowIndex = 1;
  const rows: React.ReactNode[] = [];

  listRaw.forEach((puk: any) => {
    const rincianList = puk.rincian || [];

    if (rincianList.length > 0) {
      rincianList.forEach((rp: any) => {
        const targetVolume = rp.volume ? Number(rp.volume) : 0;
        const tarif = rp.harga ? Number(rp.harga) : 0;
        const total = rp.total ? Number(rp.total) : 0;
        grandTotal += total;

        rows.push(
          <tr key={rp.id}>
            <td className="text-center">{rowIndex++}</td>
            <td>{puk.nmKegiatan || puk.nmProgram || "-"}</td>
            <td>{rp.uraian || puk.nmSubKegiatan || "-"}</td>
            <td className="text-right">{targetVolume ? formatRp(targetVolume) : "-"}</td>
            <td>{rp.satuan || "-"}</td>
            <td className="text-right">{tarif > 0 ? formatRp(tarif) : "-"}</td>
            <td className="text-right">{formatRp(total)}</td>
            <td>{puk.targetSasaran || puk.targetSasaran || "-"}</td>
          </tr>
        );
      });
    } else {
      const nilai = Number(puk.nilai || 0);
      grandTotal += nilai;
      const targetVolume = puk.targetObjek ? Number(puk.targetObjek) : 0;
      const tarif = targetVolume > 0 ? (nilai / targetVolume) : 0;

      rows.push(
        <tr key={puk.id}>
          <td className="text-center">{rowIndex++}</td>
          <td>{puk.nmKegiatan || puk.nmProgram || "-"}</td>
          <td>{puk.nmSubKegiatan || "-"}</td>
          <td className="text-right">{targetVolume ? formatRp(targetVolume) : "-"}</td>
          <td>{puk.targetSasaran || "-"}</td>
          <td className="text-right">{targetVolume > 0 ? formatRp(tarif) : "-"}</td>
          <td className="text-right">{formatRp(nilai)}</td>
          <td>{puk.targetSasaran || puk.targetSasaran || "-"}</td>
        </tr>
      );
    }
  });

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        @page { size: landscape; margin: 10mm; }
        body { background: white; font-family: 'Times New Roman', serif; font-size: 10pt; color: #000; padding: 0; }
        .cetak-container { width: 100%; max-width: 100%; margin: 0 auto; }
        .cetak-header { text-align: center; margin-bottom: 20px; font-weight: bold; font-size: 14pt; }
        .cetak-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 9pt; }
        .cetak-table th, .cetak-table td { border: 1px solid #000; padding: 6px; vertical-align: top; }
        .cetak-table th { text-align: center; font-weight: bold; vertical-align: middle; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        
        header, nav, .sidebar { display: none !important; }
        main { padding: 0 !important; margin: 0 !important; }
      `}} />

      <div className="cetak-container">
        <div className="cetak-header">
          <div>PEMERINTAH KABUPATEN TAPANULI SELATAN</div>
          <div>DINAS KESEHATAN DAERAH</div>
          <div className="uppercase">UPT {upt?.nm_upt || ""}</div>
          <div>RENCANA USULAN KEGIATAN (RUK) PENDAPATAN</div>
          <div>TAHUN ANGGARAN {tahun}</div>
        </div>

        <table className="cetak-table">
          <thead>
            <tr>
              <th style={{ width: "3%" }}>No</th>
              <th style={{ width: "15%" }}>Program/Kegiatan</th>
              <th style={{ width: "15%" }}>Jenis Layanan</th>
              <th style={{ width: "8%" }}>Target Volume</th>
              <th style={{ width: "8%" }}>Satuan</th>
              <th style={{ width: "10%" }}>Tarif (Rp)</th>
              <th style={{ width: "12%" }}>Target Pendapatan (Rp)</th>
              <th style={{ width: "19%" }}>Dasar Perhitungan</th>
            </tr>
          </thead>
          <tbody>
            {rows}
            {/* Grand Total Row */}
            <tr>
              <td colSpan={6} className="font-bold text-center" style={{ fontSize: '10pt', padding: '8px' }}>JUMLAH TOTAL (Rp)</td>
              <td className="font-bold text-right" style={{ fontSize: '10pt', padding: '8px' }}>{formatRp(grandTotal)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>

        {formattedPrintDate && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 40, pageBreakInside: "avoid" }}>
            <div style={{ textAlign: "center", width: 250 }}>
              <div style={{ marginBottom: 60 }}>
                {upt?.nm_upt ? upt.nm_upt + ", " : ""}{formattedPrintDate}
                <br />
                Pimpinan / Kepala Puskesmas
              </div>
              <div style={{ borderBottom: "1px solid #000", height: 1 }}></div>
              <div style={{ marginTop: 4, fontWeight: "bold" }}>NIP. .........................</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
