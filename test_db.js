const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const kd_upt = "1.02.5.02.0.00.02.05";
  const tahun = "2026";
  
  const rbaPendapatan = await prisma.tblRbaPenetapan.aggregate({
    where: {
      kdUnit: kd_upt,
      is_aktif: true,
      tahun: tahun,
      nmSubKegiatan: { equals: "PENDAPATAN", mode: "insensitive" }
    },
    _sum: { nilai: true },
  });

  const rbaBelanja = await prisma.tblRbaPenetapan.aggregate({
    where: {
      kdUnit: kd_upt,
      is_aktif: true,
      tahun: tahun,
      NOT: {
        nmSubKegiatan: { equals: "PENDAPATAN", mode: "insensitive" }
      }
    },
    _sum: { nilai: true },
    _count: { id: true },
  });

  console.log("Pendapatan:", rbaPendapatan._sum.nilai ? rbaPendapatan._sum.nilai.toString() : "0");
  console.log("Belanja:", rbaBelanja._sum.nilai ? rbaBelanja._sum.nilai.toString() : "0");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
