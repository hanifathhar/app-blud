const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const rbas = await prisma.tblRbaPenetapan.findMany({ where: { kd_rek6: { startsWith: '6.' } } });
  for (const rba of rbas) {
    await prisma.tblRbaPenetapan.update({
      where: { id: rba.id },
      data: {
        kdSubKegiatan: '0.00.00.0.01.01',
        nmSubKegiatan: 'PEMBIAYAAN',
        noPuk: `${rba.kdUnit || ''}0.00.00.0.01.01`
      }
    });
  }

  const rincians = await prisma.tblRbaRincianPenetapan.findMany({ where: { kd_rek6: { startsWith: '6.' } } });
  for (const rincian of rincians) {
    await prisma.tblRbaRincianPenetapan.update({
      where: { id: rincian.id },
      data: {
        kdSubKegiatan: '0.00.00.0.01.01',
        nmSubKegiatan: 'PEMBIAYAAN',
        noPuk: `${rincian.kdUnit || ''}0.00.00.0.01.01`
      }
    });
  }
  
  const rbaDraft = await prisma.tblRba.findMany({ where: { kd_rek6: { startsWith: '6.' } } });
  for (const rba of rbaDraft) {
    await prisma.tblRba.update({
      where: { id: rba.id },
      data: {
        kdSubKegiatan: '0.00.00.0.01.01',
        nmSubKegiatan: 'PEMBIAYAAN',
        noPuk: `${rba.kdUnit || ''}0.00.00.0.01.01`
      }
    });
  }

  const rbaDraftRincian = await prisma.tblRbaRincian.findMany({ where: { kd_rek6: { startsWith: '6.' } } });
  for (const rincian of rbaDraftRincian) {
    await prisma.tblRbaRincian.update({
      where: { id: rincian.id },
      data: {
        kdSubKegiatan: '0.00.00.0.01.01',
        nmSubKegiatan: 'PEMBIAYAAN',
        noPuk: `${rincian.kdUnit || ''}0.00.00.0.01.01`
      }
    });
  }

  console.log("DB Updated to 0.00.00.0.01.01!");
}
main().catch(console.error).finally(() => prisma.$disconnect());
