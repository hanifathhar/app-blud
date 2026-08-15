const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  const hash = await bcrypt.hash('password123', 10);
  
  const user = await prisma.admin.create({
    data: {
      nama: 'Test Superadmin',
      username: 'admin',
      password: hash,
      level: 1,
      status: 1,
      block: 0,
      unit: null,
      email: 'admin@test.com'
    }
  });

  console.log('Test user created:', user.username);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
