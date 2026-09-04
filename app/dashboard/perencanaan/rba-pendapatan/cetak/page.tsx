"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function CetakRbaPageContent() {
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

        const res = await fetch(`/api/perencanaan/rba-pendapatan/cetak?${query.toString()}`);
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

  // Proses Grouping
  const grouped: Record<string, any> = {};
  let grandTotal = 0;

  listRaw.forEach((rba: any) => {
    const program = "0.00.00.0.00 - PENDAPATAN";
    const kegiatan = "0.00.00.0.00 - PENDAPATAN";
    const subKeg = rba.kdSubKegiatan ? `${rba.kdSubKegiatan} - ${rba.nmSubKegiatan || 'PENDAPATAN'}` : (rba.nmSubKegiatan || 'PENDAPATAN');

    if (!grouped[program]) grouped[program] = { title: program, total: 0, items: {} };
    if (!grouped[program].items[kegiatan]) grouped[program].items[kegiatan] = { title: kegiatan, total: 0, items: {} };
    if (!grouped[program].items[kegiatan].items[subKeg]) grouped[program].items[kegiatan].items[subKeg] = { title: subKeg, total: 0, items: {} };

    const rincianList = rba.rincian || [];
    
    if (rincianList.length > 0) {
      rincianList.forEach((rin: any) => {
        const rekening = rin.kd_rek6 ? `${rin.kd_rek6} - ${rin.nm_rek6}` : (rin.nm_rek6 || '-');
        if (!grouped[program].items[kegiatan].items[subKeg].items[rekening]) {
          grouped[program].items[kegiatan].items[subKeg].items[rekening] = { title: rekening, total: 0, items: [] };
        }
        
        const rinVal = Number(rin.total || 0);
        grouped[program].items[kegiatan].items[subKeg].items[rekening].items.push({
          uraian: rin.uraian || '-',
          satuan: rin.satuan || '-',
          volume: Number(rin.volume || 0),
          biaya: Number(rin.nilai || 0),
          total: rinVal
        });
        
        grouped[program].items[kegiatan].items[subKeg].items[rekening].total += rinVal;
        grouped[program].items[kegiatan].items[subKeg].total += rinVal;
        grouped[program].items[kegiatan].total += rinVal;
        grouped[program].total += rinVal;
        grandTotal += rinVal;
      });
    } else {
      const rbaVal = Number(rba.nilai || 0);
      const rekening = rba.kd_rek6 ? `${rba.kd_rek6} - ${rba.nm_rek6}` : "-";
      if (!grouped[program].items[kegiatan].items[subKeg].items[rekening]) {
        grouped[program].items[kegiatan].items[subKeg].items[rekening] = { title: rekening, total: 0, items: [] };
      }
      grouped[program].items[kegiatan].items[subKeg].items[rekening].items.push({
        uraian: '-',
        satuan: '-',
        volume: 0,
        biaya: 0,
        total: rbaVal
      });
      grouped[program].items[kegiatan].items[subKeg].items[rekening].total += rbaVal;
      grouped[program].items[kegiatan].items[subKeg].total += rbaVal;
      grouped[program].items[kegiatan].total += rbaVal;
      grouped[program].total += rbaVal;
      grandTotal += rbaVal;
    }
  });

  const getRekeningRows = (rekGrp: any) => {
    return Math.max(1, rekGrp.items.length);
  };
  const getSubKegiatanRows = (subGrp: any) => {
    return Object.values(subGrp.items).reduce((sum: number, child: any) => sum + getRekeningRows(child), 0);
  };
  const getKegiatanRows = (kegGrp: any) => {
    return 1 + Object.values(kegGrp.items).reduce((sum: number, child: any) => sum + getSubKegiatanRows(child), 0);
  };
  const getProgramRows = (progGrp: any) => {
    return 1 + Object.values(progGrp.items).reduce((sum: number, child: any) => sum + getKegiatanRows(child), 0);
  };

  const formatRp = (num: number) => {
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
  };

  const rows: React.ReactNode[] = [];
  let rowKey = 0;

  Object.values(grouped).forEach((progGrp: any) => {
    const progRowSpan = getProgramRows(progGrp);

    rows.push(
      <tr key={`row-${rowKey++}`}>
        <td rowSpan={progRowSpan} className="font-bold">{progGrp.title}</td>
        <td></td><td></td><td></td><td></td><td></td><td></td><td></td>
        <td className="text-right font-bold">{formatRp(progGrp.total)}</td>
      </tr>
    );

    Object.values(progGrp.items).forEach((kegGrp: any) => {
      const kegRowSpan = getKegiatanRows(kegGrp);
      
      rows.push(
        <tr key={`row-${rowKey++}`}>
          <td rowSpan={kegRowSpan} className="font-bold">{kegGrp.title}</td>
          <td></td><td></td><td></td><td></td><td></td><td></td>
          <td className="text-right font-bold">{formatRp(kegGrp.total)}</td>
        </tr>
      );

      Object.values(kegGrp.items).forEach((subGrp: any) => {
        const subRowSpan = getSubKegiatanRows(subGrp);
        let isFirstSubKegRow = true;

        Object.values(subGrp.items).forEach((rekGrp: any) => {
          const rekRowSpan = getRekeningRows(rekGrp);
          let isFirstRekRow = true;
          
          rekGrp.items.forEach((item: any) => {
            if (isFirstSubKegRow) {
              rows.push(
                <tr key={`row-${rowKey++}`}>
                  <td rowSpan={subRowSpan} className="font-bold">{subGrp.title}</td>
                  <td rowSpan={rekRowSpan}>{rekGrp.title}</td>
                  <td>{item.uraian}</td>
                  <td>{item.satuan}</td>
                  <td className="text-right">{item.volume}</td>
                  <td className="text-right">{formatRp(item.biaya)}</td>
                  <td className="text-right">{formatRp(item.total)}</td>
                </tr>
              );
              isFirstSubKegRow = false;
              isFirstRekRow = false;
            } else if (isFirstRekRow) {
              rows.push(
                <tr key={`row-${rowKey++}`}>
                  <td rowSpan={rekRowSpan}>{rekGrp.title}</td>
                  <td>{item.uraian}</td>
                  <td>{item.satuan}</td>
                  <td className="text-right">{item.volume}</td>
                  <td className="text-right">{formatRp(item.biaya)}</td>
                  <td className="text-right">{formatRp(item.total)}</td>
                </tr>
              );
              isFirstRekRow = false;
            } else {
              rows.push(
                <tr key={`row-${rowKey++}`}>
                  <td>{item.uraian}</td>
                  <td>{item.satuan}</td>
                  <td className="text-right">{item.volume}</td>
                  <td className="text-right">{formatRp(item.biaya)}</td>
                  <td className="text-right">{formatRp(item.total)}</td>
                </tr>
              );
            }
          });
        });
      });
    });
  });

  return (
    <>
      <style dangerouslySetInnerHTML={{
        __html: `
        @page { size: landscape; margin: 10mm; }
        body { background: white; font-family: 'Times New Roman', serif; font-size: 10pt; color: #000; padding: 0; }
        .cetak-container { width: 100%; max-width: 100%; margin: 0 auto; }
        .cetak-header { text-align: center; margin-bottom: 20px; font-weight: bold; font-size: 14pt; }
        .cetak-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 8pt; }
        .cetak-table th, .cetak-table td { border: 1px solid #000; padding: 4px; vertical-align: top; }
        .cetak-table th { text-align: center; font-weight: bold; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        
        header, nav, .sidebar { display: none !important; }
        main { padding: 0 !important; margin: 0 !important; }
      `}} />

      <div className="cetak-container">
        <div className="cetak-header">
          <div>PEMERINTAH KABUPATEN TAPANULI SELATAN</div>
          <div className="uppercase">UPT {upt?.nm_upt || ""}</div>
          <div>RENCANA BISNIS ANGGARAN (RBA)</div>
          <div>TAHUN ANGGARAN {tahun}</div>
        </div>

        <table className="cetak-table">
          <thead>
            <tr>
              <th style={{ width: "12%" }}>Program</th>
              <th style={{ width: "12%" }}>Kegiatan</th>
              <th style={{ width: "15%" }}>Sub Kegiatan</th>
              <th style={{ width: "15%" }}>Rekening Pendapatan</th>
              <th style={{ width: "15%" }}>Uraian</th>
              <th style={{ width: "6%" }}>Satuan</th>
              <th style={{ width: "6%" }}>Volume<br />Kegiatan</th>
              <th style={{ width: "9%" }}>Biaya<br />(Rp)</th>
              <th style={{ width: "10%" }}>Total<br />(Rp)</th>
            </tr>
            <tr>
              <th>1</th><th>2</th><th>3</th><th>4</th><th>5</th>
              <th>6</th><th>8</th><th>9</th><th>10</th>
            </tr>
          </thead>
          <tbody>
            {rows}
            {/* Grand Total Row */}
            <tr>
              <td colSpan={8} className="font-bold text-center" style={{ fontSize: '10pt', padding: '8px' }}>TOTAL</td>
              <td className="font-bold text-right" style={{ fontSize: '10pt', padding: '8px' }}>{formatRp(grandTotal)}</td>
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


import { Suspense } from 'react';

export default function CetakRbaPage() {
  return (
    <Suspense fallback={<div>Memuat...</div>}>
      <CetakRbaPageContent />
    </Suspense>
  );
}
