import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkRekening() {
  const rekBarangJasa = await prisma.msRek6.findMany({
    where: { 
      kd_rek6: { startsWith: '5.1.02' }
    },
    take: 10
  });
  console.log("Belanja Barang Jasa (5.1.02.*):", rekBarangJasa.map(r => `${r.kd_rek6} - ${r.nm_rek6}`));
}

checkRekening().catch(console.error).finally(() => prisma.$disconnect());
