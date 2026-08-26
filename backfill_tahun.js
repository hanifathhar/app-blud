const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function backfill() {
  const tagihans = await prisma.tagihan.findMany({
    include: {
      permintaan_belanja: true,
      penerimaan_barang: {
        include: { pengadaan: true }
      }
    }
  });

  let count = 0;
  for (const t of tagihans) {
    if (!t.tahun) {
      let thn = '2026';
      if (t.permintaan_belanja?.tahun) thn = t.permintaan_belanja.tahun;
      else if (t.penerimaan_barang?.pengadaan?.tahun) thn = t.penerimaan_barang.pengadaan.tahun;

      await prisma.tagihan.update({
        where: { id: t.id },
        data: { tahun: thn }
      });
      count++;
    }
  }
  console.log(`Updated ${count} tagihans.`);
}

backfill().catch(console.error).finally(() => prisma.$disconnect());
