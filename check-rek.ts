import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkRekening() {
  const rekModal = await prisma.msRek6.findMany({
    where: { nm_rek6: { contains: 'modal', mode: 'insensitive' } },
    take: 5
  });
  console.log("Modal:", rekModal.map(r => `${r.kd_rek6} - ${r.nm_rek6}`));

  const rekPakaiHabis = await prisma.msRek6.findMany({
    where: { nm_rek6: { contains: 'pakai habis', mode: 'insensitive' } },
    take: 5
  });
  console.log("Pakai Habis:", rekPakaiHabis.map(r => `${r.kd_rek6} - ${r.nm_rek6}`));

  const allTypes = await prisma.msRek6.findMany({
    take: 10
  });
  console.log("Sample:", allTypes.map(r => `${r.kd_rek6} - ${r.nm_rek6}`));
}

checkRekening().catch(console.error).finally(() => prisma.$disconnect());
