const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.tagihan.findMany({ where: { tahun: '2026' } }).then(console.log).catch(console.error).finally(() => prisma.$disconnect());
