import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkRekening() {
  const rekModal = await prisma.msRek6.findMany({
    where: { 
      kd_rek6: { startsWith: '5.' },
      nm_rek6: { contains: 'modal', mode: 'insensitive' } 
    },
    take: 5
  });
  console.log("Belanja Modal (5.*):", rekModal.map(r => `${r.kd_rek6} - ${r.nm_rek6}`));

  const rekPakaiHabis = await prisma.msRek6.findMany({
    where: { 
      kd_rek6: { startsWith: '5.' },
      nm_rek6: { contains: 'pakai habis', mode: 'insensitive' } 
    },
    take: 5
  });
  console.log("Belanja Barang Pakai Habis (5.*):", rekPakaiHabis.map(r => `${r.kd_rek6} - ${r.nm_rek6}`));
}

checkRekening().catch(console.error).finally(() => prisma.$disconnect());
