const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const p = await prisma.tblRbaPenetapan.findMany({ where: { kdSubKegiatan: null } });
  console.log('Null kdSubKegiatan in penetapan:', p.map(x => ({id: x.id, nm: x.nmSubKegiatan, rek: x.kd_rek6})));
}
main().catch(console.error).finally(() => prisma.$disconnect());
