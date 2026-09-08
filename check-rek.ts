import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkRekening() {
  const rows = await prisma.$queryRawUnsafe('SELECT id, no_lpj, kd_upt, bulan, tahun, sumdan FROM "tbl_lpj"');
  console.log("all tbl_lpj:", rows);
}

checkRekening().catch(console.error).finally(() => prisma.$disconnect());


