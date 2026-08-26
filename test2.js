const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const whereClause = { tahun: '2026', AND: [{ OR: [{ permintaan_belanja: { kd_upt: 'UPT01' } }, { penerimaan_barang: { pengadaan: { kd_upt: 'UPT01' } } }] }] };
prisma.tagihan.findMany({ where: whereClause, include: { penerimaan_barang: { include: { pengadaan: true } }, permintaan_belanja: true } }).then(console.log).catch(console.error).finally(() => prisma.$disconnect());
