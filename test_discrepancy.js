const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const penetapan = await prisma.tblRbaPenetapan.findMany({
    where: { kdUnit: "1.02.5.02.0.00.02.05", tahun: "2026", is_aktif: true }
  });
  
  let totalPenetapan = 0;
  for (const p of penetapan) {
    totalPenetapan += Number(p.nilai || 0);
  }
  console.log("Total dari TblRbaPenetapan:", totalPenetapan);

  const rincian = await prisma.tblRbaRincianPenetapan.findMany({
    where: { kdUnit: "1.02.5.02.0.00.02.05", tahun: "2026", rba_penetapan: { is_aktif: true } }
  });

  let totalRincian = 0;
  let belanja = 0;
  let pendapatan = 0;
  let lainnya = 0;
  for (const r of rincian) {
    const val = Number(r.nilai || 0);
    totalRincian += val;
    if (r.kd_rek6 && r.kd_rek6.startsWith("5")) belanja += val;
    else if (r.kd_rek6 && r.kd_rek6.startsWith("4")) pendapatan += val;
    else lainnya += val;
  }
  console.log("Total dari Rincian:", totalRincian);
  console.log("Belanja:", belanja, "Pendapatan:", pendapatan, "Lainnya:", lainnya);
  
  const rincianNoRek = rincian.filter(r => !r.kd_rek6 || (!r.kd_rek6.startsWith("4") && !r.kd_rek6.startsWith("5")));
  console.log("Rincian Lainnya / No Rek:", rincianNoRek.map(r => ({id: r.id.toString(), kd_rek6: r.kd_rek6, nilai: r.nilai.toString(), uraian: r.uraian})));

}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
