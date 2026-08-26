const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const data = await prisma.permintaanBelanja.findMany({
    where: {
      tahun: '2026',
      status: 'disetujui',
      jenis_permintaan: 'pengadaan',
      pengadaan: null
    }
  });
  console.log('Count:', data.length);
  if (data.length > 0) {
    console.log(data[0]);
  }
}
check().catch(console.error).finally(() => prisma.$disconnect());
