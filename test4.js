const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const data = await prisma.permintaanBelanja.findMany({
    where: {
      tahun: '2026',
    },
    include: {
      pengadaan: true
    }
  });
  console.log('Total 2026:', data.length);
  data.forEach(d => {
    console.log(`- ${d.no_permintaan} | status: ${d.status} | jenis: ${d.jenis_permintaan} | has_pengadaan: ${!!d.pengadaan}`);
  });
}
check().catch(console.error).finally(() => prisma.$disconnect());
