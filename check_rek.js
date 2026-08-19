const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function check() {
  const r2 = await prisma.msRek2.findMany({ where: { kd_rek2: { startsWith: '6' } }});
  console.log("rek2:", r2);
  const r3 = await prisma.msRek3.findMany({ where: { kd_rek3: { startsWith: '6' } }});
  console.log("rek3:", r3);
  const r6 = await prisma.msRek6.findMany({ where: { kd_rek6: { startsWith: '6' } }});
  console.log("rek6:", r6);
}

check().catch(console.error).finally(() => prisma.$disconnect());
