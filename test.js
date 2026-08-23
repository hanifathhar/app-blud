const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const rincians = await prisma.tblRbaRincianPenetapan.findMany({ 
    where: { 
      kdUnit: '1.02.5.02.0.00.02.05',
      tahun: '2026'
    },
    take: 1
  });
  console.log(rincians);
}

main().finally(() => prisma.$disconnect());
