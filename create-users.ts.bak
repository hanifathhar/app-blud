import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.pengguna.upsert({
    where: { username: 'admin' },
    update: {
      pasword: hashedPassword,
      level: 'up2k_admin'
    },
    create: {
      nama: 'Administrator UP2K',
      username: 'admin',
      no_tlp: '081234567890',
      pasword: hashedPassword,
      level: 'up2k_admin'
    }
  });

  // Create a default group if not exists
  let kelompok = await prisma.kelompok.findFirst({
    where: { nama_kelompok: 'Kelompok Mawar' }
  });

  if (!kelompok) {
    kelompok = await prisma.kelompok.create({
      data: {
        nama_kelompok: 'Kelompok Mawar',
        desa: 'Desa Sukamaju',
        ketua: 'Ibu Budi'
      }
    });
  }

  const userKelompok = await prisma.pengguna.upsert({
    where: { username: 'kelompok' },
    update: {
      pasword: hashedPassword,
      level: 'up2k_kelompok',
      kelompokId: kelompok.id
    },
    create: {
      nama: 'Admin Kel. Mawar',
      username: 'kelompok',
      no_tlp: '081234567891',
      pasword: hashedPassword,
      level: 'up2k_kelompok',
      kelompokId: kelompok.id
    }
  });

  console.log('--- CREDENTIALS ---');
  console.log('Role: Admin (Konsolidasi)');
  console.log('Username: admin');
  console.log('Password: admin123');
  console.log('-------------------');
  console.log('Role: Kelompok');
  console.log('Username: kelompok');
  console.log('Password: admin123');
  console.log('-------------------');
}

main().catch(console.error).finally(() => prisma.$disconnect());
