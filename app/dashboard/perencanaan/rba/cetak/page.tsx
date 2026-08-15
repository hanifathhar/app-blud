"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function CetakRbaPage() {
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

        const res = await fetch(`/api/perencanaan/rba/cetak?${query.toString()}`);
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
    const ukm = rba.kdUkm ? `${rba.kdUkm} - ${rba.nmUkm}` : (rba.nmUkm || '-');
    const peruntukan = rba.kdPeruntukan ? `${rba.kdPeruntukan} - ${rba.nmPeruntukan}` : (rba.nmPeruntukan || '-');
    const komponen = rba.kdKomponen ? `${rba.kdKomponen} - ${rba.nmKomponen}` : (rba.nmKomponen || '-');
    const rincian = rba.kdRincian ? `${rba.kdRincian} - ${rba.nmRincian}` : (rba.nmRincian || '-');

    if (!grouped[ukm]) grouped[ukm] = { title: ukm, total: 0, items: {} };
    if (!grouped[ukm].items[peruntukan]) grouped[ukm].items[peruntukan] = { title: peruntukan, total: 0, items: {} };
    if (!grouped[ukm].items[peruntukan].items[komponen]) grouped[ukm].items[peruntukan].items[komponen] = { title: komponen, total: 0, items: {} };
    if (!grouped[ukm].items[peruntukan].items[komponen].items[rincian]) grouped[ukm].items[peruntukan].items[komponen].items[rincian] = { title: rincian, total: 0, items: [] };

    const subGiatTotal = rba.rincian?.length > 0
      ? rba.rincian.reduce((sum: number, r: any) => sum + Number(r.total || 0), 0)
      : Number(rba.nilai || 0);

    grouped[ukm].items[peruntukan].items[komponen].items[rincian].items.push({
      rba,
      total: subGiatTotal
    });

    grouped[ukm].items[peruntukan].items[komponen].items[rincian].total += subGiatTotal;
    grouped[ukm].items[peruntukan].items[komponen].total += subGiatTotal;
    grouped[ukm].items[peruntukan].total += subGiatTotal;
    grouped[ukm].total += subGiatTotal;
    grandTotal += subGiatTotal;
  });

  const formatRp = (num: number) => {
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
  };

  const getSubKegiatanRows = (subItem: any) => {
    return Math.max(1, subItem.rba.rincian?.length || 0);
  };
  const getRincianRows = (rinGrp: any) => {
    return 1 + rinGrp.items.reduce((sum: number, child: any) => sum + getSubKegiatanRows(child), 0);
  };
  const getKomponenRows = (kompGrp: any) => {
    return 1 + Object.values(kompGrp.items).reduce((sum: number, child: any) => sum + getRincianRows(child), 0);
  };
  const getPeruntukanRows = (prGrp: any) => {
    return 1 + Object.values(prGrp.items).reduce((sum: number, child: any) => sum + getKomponenRows(child), 0);
  };

  const rows: React.ReactNode[] = [];
  let rowKey = 0;

  Object.values(grouped).forEach((ukmGrp: any) => {
    const ukmRowSpan = 1 + Object.values(ukmGrp.items).reduce((sum: number, child: any) => sum + getPeruntukanRows(child), 0);

    // Subtotal Row UKM
    rows.push(
      <tr key={`row-${rowKey++}`}>
        <td rowSpan={ukmRowSpan} className="font-bold">{ukmGrp.title}</td>
        <td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
        <td className="text-right font-bold">{formatRp(ukmGrp.total)}</td>
      </tr>
    );

    Object.values(ukmGrp.items).forEach((prGrp: any) => {
      const prRowSpan = getPeruntukanRows(prGrp);
      rows.push(
        <tr key={`row-${rowKey++}`}>
          <td rowSpan={prRowSpan} className="font-bold">{prGrp.title}</td>
          <td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
          <td className="text-right font-bold">{formatRp(prGrp.total)}</td>
        </tr>
      );

      Object.values(prGrp.items).forEach((kompGrp: any) => {
        const kompRowSpan = getKomponenRows(kompGrp);
        rows.push(
          <tr key={`row-${rowKey++}`}>
            <td rowSpan={kompRowSpan} className="font-bold">{kompGrp.title}</td>
            <td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
            <td className="text-right font-bold">{formatRp(kompGrp.total)}</td>
          </tr>
        );

        Object.values(kompGrp.items).forEach((rinGrp: any) => {
          const rinRowSpan = getRincianRows(rinGrp);
          rows.push(
            <tr key={`row-${rowKey++}`}>
              <td rowSpan={rinRowSpan} className="font-bold">{rinGrp.title}</td>
              <td></td><td></td><td></td><td></td><td></td><td></td><td></td>
              <td className="text-right font-bold">{formatRp(rinGrp.total)}</td>
            </tr>
          );

          rinGrp.items.forEach((subItem: any) => {
            const rba = subItem.rba;
            const subRowSpan = getSubKegiatanRows(subItem);
            const titleSub = rba.kdSubKegiatan ? `${rba.kdSubKegiatan} - ${rba.nmSubKegiatan}` : rba.nmSubKegiatan;

            const rincianList = rba.rincian || [];
            if (rincianList.length === 0) {
              rows.push(
                <tr key={`row-${rowKey++}`}>
                  <td rowSpan={subRowSpan} className="font-bold">{titleSub}</td>
                  <td rowSpan={subRowSpan}>{rba.kd_rek6 ? `${rba.kd_rek6} - ${rba.nm_rek6}` : "-"}</td>
                  <td rowSpan={subRowSpan}>{rba.sumdan}</td>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                  <td className="text-right font-bold">{formatRp(subItem.total)}</td>
                </tr>
              );
            } else {
              rincianList.forEach((rp: any, idx: number) => {
                const rekeningBelanja = rp.kd_rek6 ? `${rp.kd_rek6} - ${rp.nm_rek6}` : "-";
                
                if (idx === 0) {
                  rows.push(
                    <tr key={`row-${rowKey++}`}>
                      <td rowSpan={subRowSpan} className="font-bold">{titleSub}</td>
                      <td>{rekeningBelanja}</td>
                      <td>{rp.sumdan || rba.sumdan}</td>
                      <td>{rp.uraian}</td>
                      <td>{rp.satuan}</td>
                      <td>{Number(rp.volume)}</td>
                      <td className="text-right">{formatRp(Number(rp.nilai))}</td>
                      <td className="text-right">{formatRp(Number(rp.total))}</td>
                    </tr>
                  );
                } else {
                  rows.push(
                    <tr key={`row-${rowKey++}`}>
                      <td>{rekeningBelanja}</td>
                      <td>{rp.sumdan || rba.sumdan}</td>
                      <td>{rp.uraian}</td>
                      <td>{rp.satuan}</td>
                      <td>{Number(rp.volume)}</td>
                      <td className="text-right">{formatRp(Number(rp.nilai))}</td>
                      <td className="text-right">{formatRp(Number(rp.total))}</td>
                    </tr>
                  );
                }
              });
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
              <th style={{ width: "10%" }}>Upaya<br />Kesehatan</th>
              <th style={{ width: "10%" }}>Rincian<br />Menu</th>
              <th style={{ width: "10%" }}>Komponen</th>
              <th style={{ width: "10%" }}>Sub<br />Komponen</th>
              <th style={{ width: "12%" }}>Sub Kegiatan</th>
              <th style={{ width: "12%" }}>Rekening Belanja</th>
              <th style={{ width: "6%" }}>Sumber<br />Dana</th>
              <th style={{ width: "10%" }}>Uraian</th>
              <th style={{ width: "5%" }}>Satuan</th>
              <th style={{ width: "5%" }}>Volume<br />Kegiatan</th>
              <th style={{ width: "5%" }}>Biaya<br />(Rp)</th>
              <th style={{ width: "5%" }}>Total<br />(Rp)</th>
            </tr>
            <tr>
              <th>1</th><th>2</th><th>3</th><th>4</th><th>5</th>
              <th>6</th><th>7</th><th>8</th><th>9</th><th>10</th>
              <th>11</th><th>12</th>
            </tr>
          </thead>
          <tbody>
            {rows}
            {/* Grand Total Row */}
            <tr>
              <td colSpan={11} className="font-bold text-center" style={{ fontSize: '10pt', padding: '8px' }}>TOTAL</td>
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
