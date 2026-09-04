"use client";

import React, { useState, useEffect, use } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

function CetakRKAPageContent({ params }: { params: Promise<{ kdUnit: string, nomor_penetapan: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resolvedParams = use(params);
  const kdUnit = resolvedParams.kdUnit;
  const nomor_penetapan = decodeURIComponent(resolvedParams.nomor_penetapan);
  
  const [jenis, setJenis] = useState<string>("ringkasan");
  const [kdSubKegiatan, setKdSubKegiatan] = useState<string>("");

  useEffect(() => {
    // get query param on client side using useSearchParams
    const j = searchParams.get("jenis");
    const ksk = searchParams.get("kdSubKegiatan");
    if (j) setJenis(j);
    if (ksk) setKdSubKegiatan(ksk);
  }, [searchParams]);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [userTahun, setUserTahun] = useState<string>("2024");

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get user session for year
        const userRes = await fetch("/api/me");
        const userData = await userRes.json();
        if (userData.user && userData.user.tahun) {
          setUserTahun(userData.user.tahun);
        }

        const j = searchParams.get("jenis") || "ringkasan";
        const ksk = searchParams.get("kdSubKegiatan") || "";

        const res = await fetch(`/api/perencanaan/dokumen-anggaran/cetak?kdUnit=${kdUnit}&nomor_penetapan=${encodeURIComponent(nomor_penetapan)}&jenis=${j}&kdSubKegiatan=${ksk}`);
        if (res.ok) {
          const d = await res.json();
          if (d.success) {
            setData(d.data);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [kdUnit, nomor_penetapan, searchParams]);

  useEffect(() => {
    if (!loading && data) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [loading, data]);

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", fontFamily: "sans-serif" }}>Menyiapkan dokumen cetak...</div>;
  }

  if (!data || !data.penetapan) {
    return <div style={{ padding: 40, textAlign: "center", fontFamily: "sans-serif", color: "red" }}>Data tidak ditemukan</div>;
  }

  // --- Grouping Logic ---
  const ringkasanGroups: any = {
    '4': { kd: '4', nama: 'PENDAPATAN DAERAH', total: 0, children: {} },
    '5': { kd: '5', nama: 'BELANJA DAERAH', total: 0, children: {} },
    '6': { kd: '6', nama: 'PEMBIAYAAN DAERAH', total: 0, children: {} }
  };
  
  const rkaGroups: any = {};
  const spmSumdanGroups: any = {};
  const spmReportData: any = {};
  let totalBelanjaRKA = 0;
  let totalBelanjaCustom = 0;
  
  if (jenis === 'rka_spm' && data.spmMaster) {
    data.spmMaster.forEach((spm: any) => {
      const kodeString = spm.kd_spm != null ? String(spm.kd_spm) : "-";
      spmReportData[spm.nm_spm] = {
        kd: kodeString,
        nama: spm.nm_spm,
        order: spm.kd_spm,
        kegiatanSet: new Set(),
        belanjaPegawai: 0,
        belanjaBarangJasa: 0,
        belanjaModal: 0,
        total: 0
      };
    });
  }
  
  // Pre-populate Ringkasan groups with all available rek2 and rek3
  if (jenis === 'ringkasan' && data.rek2Dict && data.rek3Dict) {
    Object.keys(data.rek2Dict).forEach(kd2 => {
      const kd1 = kd2.substring(0, 1);
      if (['4', '5', '6'].includes(kd1)) {
        if (!ringkasanGroups[kd1].children[kd2]) {
          ringkasanGroups[kd1].children[kd2] = {
            kd: kd2,
            nama: data.rek2Dict[kd2],
            total: 0,
            children: {}
          };
        }
      }
    });
    Object.keys(data.rek3Dict).forEach(kd3 => {
      const kd1 = kd3.substring(0, 1);
      const kd2 = kd3.substring(0, 3);
      if (['4', '5', '6'].includes(kd1)) {
        // Pastikan parent kd2 ada (meski mungkin data dari API tidak sinkron)
        if (!ringkasanGroups[kd1].children[kd2]) {
          ringkasanGroups[kd1].children[kd2] = {
            kd: kd2,
            nama: data.rek2Dict[kd2] || "MENDAPATKAN DATA",
            total: 0,
            children: {}
          };
        }
        if (!ringkasanGroups[kd1].children[kd2].children[kd3]) {
          ringkasanGroups[kd1].children[kd2].children[kd3] = {
            kd: kd3,
            nama: data.rek3Dict[kd3],
            total: 0
          };
        }
      }
    });
  }

  const filteredRincian = data.penetapan.rincian || [];

  filteredRincian.forEach((r: any) => {
    if (!r.kd_rek6) return;
    
    const kd1 = r.kd_rek6.substring(0, 1);
    const kd2 = r.kd_rek6.length >= 3 ? r.kd_rek6.substring(0, 3) : r.kd_rek6;
    const kd3 = r.kd_rek6.length >= 6 ? r.kd_rek6.substring(0, 6) : r.kd_rek6;
    const kd6 = r.kd_rek6;
    const val = Number(r.total) || 0;

    // --- Logic for Ringkasan ---
    if (['4', '5', '6'].includes(kd1)) {
      if (!ringkasanGroups[kd1].children[kd2]) {
        ringkasanGroups[kd1].children[kd2] = {
          kd: kd2,
          nama: data.rek2Dict[kd2] || "MENDAPATKAN DATA",
          total: 0,
          children: {}
        };
      }
      if (!ringkasanGroups[kd1].children[kd2].children[kd3]) {
        ringkasanGroups[kd1].children[kd2].children[kd3] = {
          kd: kd3,
          nama: data.rek3Dict[kd3] || "MENDAPATKAN DATA",
          total: 0
        };
      }
      ringkasanGroups[kd1].children[kd2].children[kd3].total += val;
      ringkasanGroups[kd1].children[kd2].total += val;
      ringkasanGroups[kd1].total += val;
    }

    // --- Logic for RKA ---
    if (jenis === 'rka' || jenis === 'ringkasan') {
      if (!rkaGroups[kd2]) {
        rkaGroups[kd2] = { 
          kd: kd2, 
          nama: data.rek2Dict[kd2] || "MENDAPATKAN DATA", 
          total: 0, 
          children: {} 
        };
      }
      
      if (!rkaGroups[kd2].children[kd3]) {
        rkaGroups[kd2].children[kd3] = { 
          kd: kd3, 
          nama: data.rek3Dict[kd3] || "MENDAPATKAN DATA", 
          total: 0, 
          children: {} 
        };
      }

      if (!rkaGroups[kd2].children[kd3].children[kd6]) {
        rkaGroups[kd2].children[kd3].children[kd6] = {
          kd: kd6,
          nama: r.nm_rek6,
          total: 0,
          items: []
        }
      }

      rkaGroups[kd2].children[kd3].children[kd6].items.push(r);
      rkaGroups[kd2].children[kd3].children[kd6].total += val;
      rkaGroups[kd2].children[kd3].total += val;
      rkaGroups[kd2].total += val;
      totalBelanjaRKA += val;
    }

    // --- Logic for SPM / Sumber Dana ---
    const isCustomRKA = jenis === 'rka_spm' || jenis === 'rka_sumber_dana';
    
    if (isCustomRKA && kd1 === '5') {
      const groupKey = jenis === 'rka_spm' ? (r.nmSpm || '-') : (r.sumdan || '-');
      
      if (jenis === 'rka_spm') {
        if (!spmReportData[groupKey]) {
           spmReportData[groupKey] = {
             kd: r.kdSpm || '-',
             nama: groupKey,
             order: 9999, // default if not in master
             kegiatanSet: new Set(),
             belanjaPegawai: 0,
             belanjaBarangJasa: 0,
             belanjaModal: 0,
             total: 0
           };
        }
        if (r.kdSubKegiatan) {
          spmReportData[groupKey].kegiatanSet.add(r.kdSubKegiatan);
        }
        
        if (kd6.startsWith('5.1.01')) {
          spmReportData[groupKey].belanjaPegawai += val;
        } else if (kd6.startsWith('5.1.02')) {
          spmReportData[groupKey].belanjaBarangJasa += val;
        } else if (kd6.startsWith('5.2')) {
          spmReportData[groupKey].belanjaModal += val;
        }
        spmReportData[groupKey].total += val;
        totalBelanjaCustom += val;
      } else {
        if (!spmSumdanGroups[groupKey]) {
          spmSumdanGroups[groupKey] = {
            nama: groupKey,
            total: 0,
            children: {}
          };
        }

        if (!spmSumdanGroups[groupKey].children[kd2]) {
          spmSumdanGroups[groupKey].children[kd2] = {
            kd: kd2,
            nama: data.rek2Dict[kd2] || "MENDAPATKAN DATA",
            total: 0,
            children: {}
          };
        }

        if (!spmSumdanGroups[groupKey].children[kd2].children[kd3]) {
          spmSumdanGroups[groupKey].children[kd2].children[kd3] = {
            kd: kd3,
            nama: data.rek3Dict[kd3] || "MENDAPATKAN DATA",
            total: 0,
            children: {}
          };
        }

        if (!spmSumdanGroups[groupKey].children[kd2].children[kd3].children[kd6]) {
          spmSumdanGroups[groupKey].children[kd2].children[kd3].children[kd6] = {
            kd: kd6,
            nama: r.nm_rek6,
            total: 0,
            items: []
          }
        }

        spmSumdanGroups[groupKey].children[kd2].children[kd3].children[kd6].items.push(r);
        spmSumdanGroups[groupKey].children[kd2].children[kd3].children[kd6].total += val;
        spmSumdanGroups[groupKey].children[kd2].children[kd3].total += val;
        spmSumdanGroups[groupKey].children[kd2].total += val;
        spmSumdanGroups[groupKey].total += val;
        totalBelanjaCustom += val;
      }
    }
  });

  const { penetapan, metadata } = data;

  const formatCurrency = (val: number) => {
    if (val < 0) {
      return '(' + new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2 }).format(Math.abs(val)) + ')';
    }
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 2 }).format(val);
  };

  const formatCurrency0 = (val: number) => {
    if (val < 0) {
      return '(' + new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(Math.abs(val)) + ')';
    }
    return new Intl.NumberFormat('id-ID', { minimumFractionDigits: 0 }).format(val);
  };

  // Render Rows for Ringkasan
  const renderRingkasanRows = () => {
    const rows: React.JSX.Element[] = [];

    // 1. PENDAPATAN
    const p = ringkasanGroups['4'];
    rows.push(
      <tr key="4">
        <td style={styles.tdBold}>4</td>
        <td style={styles.tdBold}>PENDAPATAN DAERAH</td>
        <td style={styles.tdRightBold}>{formatCurrency(p.total)}</td>
      </tr>
    );
    Object.keys(p.children).sort().forEach(kd2 => {
      const g2 = p.children[kd2];
      rows.push(
        <tr key={kd2}>
          <td style={styles.tdBold}>{kd2}</td>
          <td style={styles.tdBold}>{g2.nama}</td>
          <td style={styles.tdRightBold}>{formatCurrency(g2.total)}</td>
        </tr>
      );
      Object.keys(g2.children).sort().forEach(kd3 => {
        const g3 = g2.children[kd3];
        rows.push(
          <tr key={kd3}>
            <td style={styles.td}>{kd3}</td>
            <td style={styles.td}>{g3.nama}</td>
            <td style={styles.tdRight}>{formatCurrency(g3.total)}</td>
          </tr>
        );
      });
    });

    const totalPendapatan = p.total;
    rows.push(
      <tr key="jml-pendapatan">
        <td style={styles.tdBold}></td>
        <td style={styles.tdBold}>JUMLAH PENDAPATAN</td>
        <td style={styles.tdRightBold}>{formatCurrency(totalPendapatan)}</td>
      </tr>
    );

    rows.push(
      <tr key="blank-1">
        <td colSpan={3} style={{ border: '1px solid #000', padding: '4px' }}></td>
      </tr>
    );

    // 2. BELANJA
    const b = ringkasanGroups['5'];
    rows.push(
      <tr key="5">
        <td style={styles.tdBold}>5</td>
        <td style={styles.tdBold}>BELANJA DAERAH</td>
        <td style={styles.tdRightBold}>{formatCurrency(b.total)}</td>
      </tr>
    );
    Object.keys(b.children).sort().forEach(kd2 => {
      const g2 = b.children[kd2];
      rows.push(
        <tr key={kd2}>
          <td style={styles.tdBold}>{kd2}</td>
          <td style={styles.tdBold}>{g2.nama}</td>
          <td style={styles.tdRightBold}>{formatCurrency(g2.total)}</td>
        </tr>
      );
      Object.keys(g2.children).sort().forEach(kd3 => {
        const g3 = g2.children[kd3];
        rows.push(
          <tr key={kd3}>
            <td style={styles.td}>{kd3}</td>
            <td style={styles.td}>{g3.nama}</td>
            <td style={styles.tdRight}>{formatCurrency(g3.total)}</td>
          </tr>
        );
      });
    });

    const totalBelanja = b.total;
    rows.push(
      <tr key="jml-belanja">
        <td style={styles.tdBold}></td>
        <td style={styles.tdBold}>JUMLAH BELANJA</td>
        <td style={styles.tdRightBold}>{formatCurrency(totalBelanja)}</td>
      </tr>
    );

    const surplusDefisit = totalPendapatan - totalBelanja;
    rows.push(
      <tr key="surplus">
        <td style={styles.tdBold}></td>
        <td style={styles.tdBold}>SURPLUS/(DEFISIT)</td>
        <td style={styles.tdRightBold}>{formatCurrency(surplusDefisit)}</td>
      </tr>
    );

    rows.push(
      <tr key="blank-2">
        <td colSpan={3} style={{ border: '1px solid #000', padding: '4px' }}></td>
      </tr>
    );

    // 3. PEMBIAYAAN
    const pmb = ringkasanGroups['6'];
    // In some systems it's numbered 3, but the code is 6. We will stick to 6 for consistency.
    rows.push(
      <tr key="6">
        <td style={styles.tdBold}>6</td>
        <td style={styles.tdBold}>PEMBIAYAAN DAERAH</td>
        <td style={styles.tdRightBold}></td>
      </tr>
    );

    const pmbTerima = pmb.children['6.1']?.total || 0;
    if (pmb.children['6.1']) {
      const g2 = pmb.children['6.1'];
      rows.push(
        <tr key="6.1">
          <td style={styles.tdBold}>6.1</td>
          <td style={styles.tdBold}>{g2.nama || 'PENERIMAAN PEMBIAYAAN'}</td>
          <td style={styles.tdRightBold}>{formatCurrency(g2.total)}</td>
        </tr>
      );
      Object.keys(g2.children).sort().forEach(kd3 => {
        const g3 = g2.children[kd3];
        rows.push(
          <tr key={kd3}>
            <td style={styles.td}>{kd3}</td>
            <td style={styles.td}>{g3.nama}</td>
            <td style={styles.tdRight}>{formatCurrency(g3.total)}</td>
          </tr>
        );
      });
    }

    rows.push(
      <tr key="jml-penerimaan">
        <td style={styles.tdBold}></td>
        <td style={styles.tdBold}>JUMLAH PENERIMAAN PEMBIAYAAN</td>
        <td style={styles.tdRightBold}>{formatCurrency(pmbTerima)}</td>
      </tr>
    );

    rows.push(
      <tr key="blank-3">
        <td colSpan={3} style={{ border: '1px solid #000', padding: '4px' }}></td>
      </tr>
    );

    const pmbKeluar = pmb.children['6.2']?.total || 0;
    if (pmb.children['6.2']) {
      const g2 = pmb.children['6.2'];
      rows.push(
        <tr key="6.2">
          <td style={styles.tdBold}>6.2</td>
          <td style={styles.tdBold}>{g2.nama || 'PENGELUARAN PEMBIAYAAN'}</td>
          <td style={styles.tdRightBold}>{formatCurrency(g2.total)}</td>
        </tr>
      );
      Object.keys(g2.children).sort().forEach(kd3 => {
        const g3 = g2.children[kd3];
        rows.push(
          <tr key={kd3}>
            <td style={styles.td}>{kd3}</td>
            <td style={styles.td}>{g3.nama}</td>
            <td style={styles.tdRight}>{formatCurrency(g3.total)}</td>
          </tr>
        );
      });
    }

    rows.push(
      <tr key="jml-pengeluaran">
        <td style={styles.tdBold}></td>
        <td style={styles.tdBold}>JUMLAH PENGELUARAN PEMBIAYAAN</td>
        <td style={styles.tdRightBold}>{formatCurrency(pmbKeluar)}</td>
      </tr>
    );

    rows.push(
      <tr key="blank-4">
        <td colSpan={3} style={{ border: '1px solid #000', padding: '4px' }}></td>
      </tr>
    );

    const netto = pmbTerima - pmbKeluar;
    rows.push(
      <tr key="netto">
        <td style={styles.tdBold}></td>
        <td style={styles.tdBold}>PEMBIAYAAN NETTO</td>
        <td style={styles.tdRightBold}>{formatCurrency(netto)}</td>
      </tr>
    );

    const silpa = surplusDefisit + netto;
    rows.push(
      <tr key="silpa">
        <td style={styles.tdBold}></td>
        <td style={styles.tdBold}>SISA LEBIH PEMBIAYAAN ANGGARAN TAHUN BERKENAAN (SILPA)</td>
        <td style={styles.tdRightBold}>{formatCurrency(silpa)}</td>
      </tr>
    );

    return rows;
  };

  // Render Rows for RKA
  const renderRKARows = () => {
    const rows: React.JSX.Element[] = [];
    
    Object.keys(rkaGroups).sort().forEach(kd2 => {
      const g2 = rkaGroups[kd2];
      rows.push(
        <tr key={kd2}>
          <td style={styles.tdBold}>{kd2}</td>
          <td style={styles.tdBold}>{g2.nama}</td>
          <td style={styles.tdCenter}></td>
          <td style={styles.tdCenter}></td>
          <td style={styles.tdRight}></td>
          <td style={styles.tdRightBold}>{formatCurrency(g2.total)}</td>
        </tr>
      );

      Object.keys(g2.children).sort().forEach(kd3 => {
        const g3 = g2.children[kd3];
        rows.push(
          <tr key={kd3}>
            <td style={styles.tdBold}>{kd3}</td>
            <td style={styles.tdBold}>{g3.nama}</td>
            <td style={styles.tdCenter}></td>
            <td style={styles.tdCenter}></td>
            <td style={styles.tdRight}></td>
            <td style={styles.tdRightBold}>{formatCurrency(g3.total)}</td>
          </tr>
        );

        Object.keys(g3.children).sort().forEach(kd6 => {
          const g6 = g3.children[kd6];
          rows.push(
            <tr key={kd6}>
              <td style={styles.tdBold}>{kd6}</td>
              <td style={styles.tdBold}>{g6.nama}</td>
              <td style={styles.tdCenter}></td>
              <td style={styles.tdCenter}></td>
              <td style={styles.tdRight}></td>
              <td style={styles.tdRightBold}>{formatCurrency(g6.total)}</td>
            </tr>
          );

          g6.items.forEach((item: any, idx: number) => {
            rows.push(
              <tr key={`${kd6}-${idx}`}>
                <td style={styles.td}></td>
                <td style={styles.td}>{item.uraian}</td>
                <td style={styles.tdCenter}>{Number(item.volume) || ""}</td>
                <td style={styles.tdCenter}>{item.satuan}</td>
                <td style={styles.tdRight}>{item.nilai ? formatCurrency(item.nilai) : ""}</td>
                <td style={styles.tdRight}>{item.total ? formatCurrency(item.total) : ""}</td>
              </tr>
            );
          });
        });
      });
    });

    return rows;
  };

  // Render Rows for Custom RKA (SPM / Sumdan)
  const renderCustomRKARows = () => {
    const rows: React.JSX.Element[] = [];
    
    Object.keys(spmSumdanGroups).sort().forEach(groupKey => {
      const gGroup = spmSumdanGroups[groupKey];
      // Title row for SPM / Sumdan
      rows.push(
        <tr key={groupKey} style={{ backgroundColor: "#E2E8F0" }}>
          <td colSpan={5} style={{ ...styles.tdBold, textAlign: "left", textTransform: "uppercase" }}>
            {jenis === 'rka_spm' ? 'SPM: ' : 'SUMBER DANA: '} {gGroup.nama}
          </td>
          <td style={styles.tdRightBold}>{formatCurrency(gGroup.total)}</td>
        </tr>
      );

      Object.keys(gGroup.children).sort().forEach(kd2 => {
        const g2 = gGroup.children[kd2];
        rows.push(
          <tr key={`${groupKey}-${kd2}`}>
            <td style={styles.tdBold}>{kd2}</td>
            <td style={styles.tdBold}>{g2.nama}</td>
            <td style={styles.tdCenter}></td>
            <td style={styles.tdCenter}></td>
            <td style={styles.tdRight}></td>
            <td style={styles.tdRightBold}>{formatCurrency(g2.total)}</td>
          </tr>
        );

        Object.keys(g2.children).sort().forEach(kd3 => {
          const g3 = g2.children[kd3];
          rows.push(
            <tr key={`${groupKey}-${kd3}`}>
              <td style={styles.tdBold}>{kd3}</td>
              <td style={styles.tdBold}>{g3.nama}</td>
              <td style={styles.tdCenter}></td>
              <td style={styles.tdCenter}></td>
              <td style={styles.tdRight}></td>
              <td style={styles.tdRightBold}>{formatCurrency(g3.total)}</td>
            </tr>
          );

          Object.keys(g3.children).sort().forEach(kd6 => {
            const g6 = g3.children[kd6];
            rows.push(
              <tr key={`${groupKey}-${kd6}`}>
                <td style={styles.tdBold}>{kd6}</td>
                <td style={styles.tdBold}>{g6.nama}</td>
                <td style={styles.tdCenter}></td>
                <td style={styles.tdCenter}></td>
                <td style={styles.tdRight}></td>
                <td style={styles.tdRightBold}>{formatCurrency(g6.total)}</td>
              </tr>
            );

            g6.items.forEach((item: any, idx: number) => {
              rows.push(
                <tr key={`${groupKey}-${kd6}-${idx}`}>
                  <td style={styles.td}></td>
                  <td style={styles.td}>{item.uraian}</td>
                  <td style={styles.tdCenter}>{Number(item.volume) || ""}</td>
                  <td style={styles.tdCenter}>{item.satuan}</td>
                  <td style={styles.tdRight}>{item.nilai ? formatCurrency(item.nilai) : ""}</td>
                  <td style={styles.tdRight}>{item.total ? formatCurrency(item.total) : ""}</td>
                </tr>
              );
            });
          });
        });
      });
    });

    return rows;
  };

  const renderSpmReportRows = () => {
    let totalPegawai = 0;
    let totalBarangJasa = 0;
    let totalModal = 0;
    let grandTotal = 0;
    let totalKegiatan = 0;

    const rows = Object.keys(spmReportData).sort((a, b) => {
      return (spmReportData[a].order || 9999) - (spmReportData[b].order || 9999);
    }).map((groupKey, idx) => {
      const g = spmReportData[groupKey];
      
      totalPegawai += g.belanjaPegawai;
      totalBarangJasa += g.belanjaBarangJasa;
      totalModal += g.belanjaModal;
      grandTotal += g.total;
      totalKegiatan += g.kegiatanSet.size;

      const kodeSpm = g.kd !== '-' ? g.kd : (g.order ? String(g.order) : "-");

      return (
        <tr key={groupKey}>
          <td style={styles.tdCenter}>{idx + 1}</td>
          <td style={styles.tdCenter}>{kodeSpm}</td>
          <td style={styles.td}>{g.nama}</td>
          <td style={styles.tdCenter}>{g.kegiatanSet.size}</td>
          <td style={styles.tdRight}>{g.belanjaPegawai === 0 ? "0" : formatCurrency0(g.belanjaPegawai)}</td>
          <td style={styles.tdRight}>{g.belanjaBarangJasa === 0 ? "0" : formatCurrency0(g.belanjaBarangJasa)}</td>
          <td style={styles.tdRight}>{g.belanjaModal === 0 ? "0" : formatCurrency0(g.belanjaModal)}</td>
          <td style={styles.tdRightBold}>{g.total === 0 ? "0" : formatCurrency0(g.total)}</td>
        </tr>
      );
    });

    // Add Total Row
    rows.push(
      <tr key="total" style={{ backgroundColor: "#f9f9f9" }}>
        <td colSpan={3} style={{ ...styles.tdBold, textAlign: "center" }}>TOTAL</td>
        <td style={styles.tdCenterBold}>{totalKegiatan}</td>
        <td style={styles.tdRightBold}>{totalPegawai === 0 ? "0" : formatCurrency0(totalPegawai)}</td>
        <td style={styles.tdRightBold}>{totalBarangJasa === 0 ? "0" : formatCurrency0(totalBarangJasa)}</td>
        <td style={styles.tdRightBold}>{totalModal === 0 ? "0" : formatCurrency0(totalModal)}</td>
        <td style={styles.tdRightBold}>{grandTotal === 0 ? "0" : formatCurrency0(grandTotal)}</td>
      </tr>
    );

    return rows;
  };

  const isLandscape = jenis === 'rka_spm';

  return (
    <div style={{ backgroundColor: "#ccc", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: "20px 0" }}>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: #fff !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          @page {
            size: A4 ${isLandscape ? 'landscape' : 'portrait'};
            margin: 1.5cm;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />

      {/* Floating Toolbar - Sembunyi saat diprint */}
      <div className="no-print" style={{ 
        position: "sticky", 
        top: 24, 
        zIndex: 50, 
        display: "flex", 
        justifyContent: "center",
        marginBottom: 32 
      }}>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 8, 
          padding: "6px 8px", 
          backgroundColor: "rgba(255, 255, 255, 0.9)", 
          backdropFilter: "blur(8px)",
          borderRadius: 999, 
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          border: "1px solid #E2E8F0"
        }}>
          <button 
            onClick={() => router.push(`/dashboard/perencanaan/dokumen-anggaran/${kdUnit}/${encodeURIComponent(nomor_penetapan)}`)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, backgroundColor: "transparent", color: "#64748B", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, transition: "all 0.2s" }}
            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = "#F1F5F9"; e.currentTarget.style.color = "#0F172A" }}
            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#64748B" }}
          >
            <ArrowLeft size={14} />
            Kembali
          </button>
          
          <div style={{ width: 1, height: 16, backgroundColor: "#E2E8F0" }}></div>

          <button 
            onClick={() => window.print()}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 999, backgroundColor: "#0F172A", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, transition: "all 0.2s" }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#334155"}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#0F172A"}
          >
            <Printer size={14} />
            Cetak Dokumen
          </button>
        </div>
      </div>

      <div id="print-area" style={{ backgroundColor: "#fff", width: isLandscape ? "29.7cm" : "21cm", minHeight: isLandscape ? "21cm" : "29.7cm", padding: "1.5cm", boxSizing: "border-box", fontFamily: "'Times New Roman', Times, serif", fontSize: "12px", color: "#000", margin: "0 auto", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", border: "1px solid #E2E8F0" }}>
        
        {jenis === 'rka_spm' ? (
          <div style={{ textAlign: "center", fontWeight: "bold", fontSize: "16px", marginBottom: "20px" }}>
            REKAPITULASI ANGGARAN PER SPM<br/>
            PUSKESMAS {penetapan.nmUnit?.replace("Puskesmas ", "")?.toUpperCase()}<br/>
            TAHUN ANGGARAN {userTahun}
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", marginBottom: 0 }}>
            <tbody>
              <tr>
                <td style={{ width: "120px", border: "1px solid #000", textAlign: "center", padding: "10px" }} rowSpan={2}>
                  {/* Logo Placeholder */}
                  <div style={{ width: "80px", height: "80px", border: "1px solid #999", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", color: "#999", fontSize: "10px" }}>
                    LOGO<br/>KOTA
                  </div>
                </td>
                <td style={{ border: "1px solid #000", textAlign: "center", fontWeight: "bold", fontSize: "14px", padding: "4px" }}>
                  RENCANA KERJA DAN ANGGARAN<br/>
                  BADAN LAYANAN UMUM DAERAH
                </td>
                <td style={{ width: "120px", border: "1px solid #000", textAlign: "center", fontWeight: "bold", fontSize: "13px" }} rowSpan={2}>
                  RKA BLUD
                </td>
              </tr>
              <tr>
                <td style={{ border: "1px solid #000", textAlign: "center", fontSize: "13px", padding: "4px" }}>
                  PUSKESMAS {penetapan.nmUnit?.replace("Puskesmas ", "")?.toUpperCase()}<br/>
                  TAHUN ANGGARAN {userTahun}
                </td>
              </tr>
            </tbody>
          </table>
        )}

        {jenis === 'rka' && (
          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", borderTop: "none" }}>
            <tbody>
              <tr>
                <td style={styles.metaLabel}>Program</td>
                <td style={styles.metaValue}>{metadata.kd_program} - {metadata.nm_program}</td>
              </tr>
              <tr>
                <td style={styles.metaLabel}>Kegiatan</td>
                <td style={styles.metaValue}>{metadata.kd_kegiatan} - {metadata.nm_kegiatan}</td>
              </tr>
              <tr>
                <td style={styles.metaLabel}>Sub Kegiatan</td>
                <td style={styles.metaValue}>{penetapan.kdSubKegiatan} - {penetapan.nmSubKegiatan}</td>
              </tr>
              <tr>
                <td style={styles.metaLabel}>SPM</td>
                <td style={styles.metaValue}>{penetapan.nmSpm}</td>
              </tr>
              <tr>
                <td style={styles.metaLabel}>Sumber Pendanaan</td>
                <td style={styles.metaValue}>{penetapan.sumdan || "-"}</td>
              </tr>
            </tbody>
          </table>
        )}

        {jenis === 'ringkasan' ? (
          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", borderTop: "none" }}>
            <thead>
              <tr>
                <td colSpan={3} style={{ textAlign: "center", fontWeight: "bold", fontSize: "13px", padding: "8px", borderBottom: "1px solid #000" }}>
                  RINGKASAN ANGGARAN PENDAPATAN, BELANJA, PEMBIAYAAN<br/>BADAN LAYANAN UMUM DAERAH
                </td>
              </tr>
              <tr>
                <th style={{ ...styles.th, width: "15%" }}>NOMOR<br/>URUT</th>
                <th style={{ ...styles.th, width: "60%" }}>URAIAN</th>
                <th style={{ ...styles.th, width: "25%" }}>JUMLAH<br/>(Rp)</th>
              </tr>
              <tr>
                <th style={styles.thColNum}>1</th>
                <th style={styles.thColNum}>2</th>
                <th style={styles.thColNum}>3</th>
              </tr>
            </thead>
            <tbody>
              {renderRingkasanRows()}
            </tbody>
          </table>
        ) : jenis === 'rka' ? (
          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", borderTop: "none" }}>
            <thead>
              <tr>
                <td colSpan={6} style={{ textAlign: "center", fontWeight: "bold", fontSize: "13px", padding: "8px", borderBottom: "1px solid #000" }}>
                  RENCANA KERJA DAN ANGGARAN<br/>SUB KEGIATAN BADAN LAYANAN UMUM DAERAH
                </td>
              </tr>
              <tr>
                <th style={{ ...styles.th, width: "20%" }} rowSpan={2}>Kode<br/>Rekening</th>
                <th style={{ ...styles.th, width: "35%" }} rowSpan={2}>Uraian</th>
                <th style={{ ...styles.th, width: "30%" }} colSpan={3}>Rincian Perhitungan</th>
                <th style={{ ...styles.th, width: "15%" }} rowSpan={2}>Jumlah<br/>(Rp)</th>
              </tr>
              <tr>
                <th style={styles.thSub}>Volume</th>
                <th style={styles.thSub}>Satuan</th>
                <th style={styles.thSub}>Harga</th>
              </tr>
              <tr>
                <th style={styles.thColNum}>1</th>
                <th style={styles.thColNum}>2</th>
                <th style={styles.thColNum}>3</th>
                <th style={styles.thColNum}>4</th>
                <th style={styles.thColNum}>5</th>
                <th style={styles.thColNum}>6 = 3 x 5</th>
              </tr>
            </thead>
            <tbody>
              {renderRKARows()}
              <tr>
                <td colSpan={2} style={{ ...styles.tdBold, textAlign: "center" }}>JUMLAH</td>
                <td style={styles.tdCenter}></td>
                <td style={styles.tdCenter}></td>
                <td style={styles.tdRight}></td>
                <td style={styles.tdRightBold}>{formatCurrency(totalBelanjaRKA)}</td>
              </tr>
            </tbody>
          </table>
        ) : jenis === 'rka_spm' ? (
          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000" }}>
            <thead>
              <tr>
                <th style={{ ...styles.th, width: "5%" }}>No</th>
                <th style={{ ...styles.th, width: "10%" }}>Kode</th>
                <th style={{ ...styles.th, width: "25%" }}>Standar Pelayanan Minimal</th>
                <th style={{ ...styles.th, width: "12%" }}>Jumlah<br/>Kegiatan</th>
                <th style={{ ...styles.th, width: "12%" }}>Belanja<br/>Pegawai</th>
                <th style={{ ...styles.th, width: "12%" }}>Belanja<br/>Barang/Jasa</th>
                <th style={{ ...styles.th, width: "12%" }}>Belanja<br/>Modal</th>
                <th style={{ ...styles.th, width: "12%" }}>Total Anggaran</th>
              </tr>
            </thead>
            <tbody>
              {renderSpmReportRows()}
            </tbody>
          </table>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000", borderTop: "none" }}>
            <thead>
              <tr>
                <td colSpan={6} style={{ textAlign: "center", fontWeight: "bold", fontSize: "13px", padding: "8px", borderBottom: "1px solid #000" }}>
                  RINCIAN BELANJA BERDASARKAN SUMBER DANA<br/>BADAN LAYANAN UMUM DAERAH
                </td>
              </tr>
              <tr>
                <th style={{ ...styles.th, width: "20%" }} rowSpan={2}>Kode<br/>Rekening</th>
                <th style={{ ...styles.th, width: "35%" }} rowSpan={2}>Uraian</th>
                <th style={{ ...styles.th, width: "30%" }} colSpan={3}>Rincian Perhitungan</th>
                <th style={{ ...styles.th, width: "15%" }} rowSpan={2}>Jumlah<br/>(Rp)</th>
              </tr>
              <tr>
                <th style={styles.thSub}>Volume</th>
                <th style={styles.thSub}>Satuan</th>
                <th style={styles.thSub}>Harga</th>
              </tr>
              <tr>
                <th style={styles.thColNum}>1</th>
                <th style={styles.thColNum}>2</th>
                <th style={styles.thColNum}>3</th>
                <th style={styles.thColNum}>4</th>
                <th style={styles.thColNum}>5</th>
                <th style={styles.thColNum}>6 = 3 x 5</th>
              </tr>
            </thead>
            <tbody>
              {renderCustomRKARows()}
              <tr>
                <td colSpan={2} style={{ ...styles.tdBold, textAlign: "center" }}>JUMLAH BELANJA</td>
                <td style={styles.tdCenter}></td>
                <td style={styles.tdCenter}></td>
                <td style={styles.tdRight}></td>
                <td style={styles.tdRightBold}>{formatCurrency(totalBelanjaCustom)}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  metaLabel: { border: "1px solid #000", padding: "4px 6px", width: "140px" },
  metaValue: { border: "1px solid #000", padding: "4px 6px" },
  
  th: { border: "1px solid #000", padding: "6px", textAlign: "center", fontWeight: "bold" },
  thSub: { border: "1px solid #000", padding: "6px", textAlign: "center", fontWeight: "bold", width: "10%" },
  thColNum: { border: "1px solid #000", padding: "4px", textAlign: "center", fontWeight: "bold", backgroundColor: "#f9f9f9" },

  td: { border: "1px solid #000", padding: "4px 6px", verticalAlign: "top" },
  tdBold: { border: "1px solid #000", padding: "4px 6px", fontWeight: "bold", verticalAlign: "top" },
  tdCenter: { border: "1px solid #000", padding: "4px 6px", textAlign: "center", verticalAlign: "top" },
  tdCenterBold: { border: "1px solid #000", padding: "4px 6px", textAlign: "center", fontWeight: "bold", verticalAlign: "top" },
  tdRight: { border: "1px solid #000", padding: "4px 6px", textAlign: "right", verticalAlign: "top" },
  tdRightBold: { border: "1px solid #000", padding: "4px 6px", textAlign: "right", fontWeight: "bold", verticalAlign: "top" }
};



import { Suspense } from 'react';

export default function CetakRKAPage({ params }: { params: Promise<{ kdUnit: string, nomor_penetapan: string }> }) {
  return (
    <Suspense fallback={<div>Memuat...</div>}>
      <CetakRKAPageContent params={params} />
    </Suspense>
  );
}
