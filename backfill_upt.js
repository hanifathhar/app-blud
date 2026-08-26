const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function backfill() {
  // Get all MsUpt
  const upts = await prisma.msUpt.findMany();
  const uptMap = {};
  for (const u of upts) {
    if (u.kd_upt) uptMap[u.kd_upt] = u.nm_upt;
  }

  // 1. Backfill Pengadaan
  const pengadaans = await prisma.pengadaan.findMany();
  let countPengadaan = 0;
  for (const p of pengadaans) {
    if (p.kd_upt && !p.nm_upt && uptMap[p.kd_upt]) {
      await prisma.pengadaan.update({
        where: { id: p.id },
        data: { nm_upt: uptMap[p.kd_upt] }
      });
      countPengadaan++;
    }
  }

  // 2. Backfill PenerimaanBarang
  const penerimaans = await prisma.penerimaanBarang.findMany({
    include: { pengadaan: true }
  });
  let countPenerimaan = 0;
  for (const b of penerimaans) {
    if (!b.kd_upt && b.pengadaan?.kd_upt) {
      await prisma.penerimaanBarang.update({
        where: { id: b.id },
        data: { 
          kd_upt: b.pengadaan.kd_upt,
          nm_upt: uptMap[b.pengadaan.kd_upt] || null
        }
      });
      countPenerimaan++;
    }
  }

  // 3. Backfill Tagihan
  const tagihans = await prisma.tagihan.findMany({
    include: {
      permintaan_belanja: true,
      penerimaan_barang: { include: { pengadaan: true } }
    }
  });
  let countTagihan = 0;
  for (const t of tagihans) {
    if (!t.kd_upt) {
      let kd = null;
      if (t.permintaan_belanja?.kd_upt) kd = t.permintaan_belanja.kd_upt;
      else if (t.penerimaan_barang?.pengadaan?.kd_upt) kd = t.penerimaan_barang.pengadaan.kd_upt;

      if (kd) {
        await prisma.tagihan.update({
          where: { id: t.id },
          data: {
            kd_upt: kd,
            nm_upt: uptMap[kd] || null
          }
        });
        countTagihan++;
      }
    }
  }

  console.log(`Updated Pengadaan: ${countPengadaan}`);
  console.log(`Updated PenerimaanBarang: ${countPenerimaan}`);
  console.log(`Updated Tagihan: ${countTagihan}`);
}

backfill().catch(console.error).finally(() => prisma.$disconnect());
