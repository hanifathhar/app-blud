const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.permintaanBelanja.findMany({ select: { status: true } }).then(data => console.log([...new Set(data.map(d => d.status))])).catch(console.error).finally(() => prisma.$disconnect());
