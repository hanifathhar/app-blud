const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const count = await prisma.tahunAnggaran.count();
  if (count === 0) {
    await prisma.tahunAnggaran.createMany({
      data: [
        { tahun: 2024, status: 'tidak aktif', keterangan: 'Tahun 2024' },
        { tahun: 2025, status: 'aktif', keterangan: 'Tahun Berjalan 2025' }
      ]
    });
    console.log('Tahun anggaran created');
  } else {
    console.log('Tahun anggaran already exists');
  }
}

run()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
