const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  // Создаём категории
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { name: 'Хуреш' },
      update: {},
      create: { name: 'Хуреш' },
    }),
    prisma.category.upsert({
      where: { name: 'Стрельба из лука' },
      update: {},
      create: { name: 'Стрельба из лука' },
    }),
    prisma.category.upsert({
      where: { name: 'Конные состязания' },
      update: {},
      create: { name: 'Конные состязания' },
    }),
    prisma.category.upsert({
      where: { name: 'Национальная атрибутика' },
      update: {},
      create: { name: 'Национальная атрибутика' },
    }),
    prisma.category.upsert({
      where: { name: 'Общие спортивные товары' },
      update: {},
      create: { name: 'Общие спортивные товары' },
    }),
  ]);

  console.log('Категории созданы:', categories.map(c => c.name));

  // Создаём admin пользователя
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@tyvashop.ru' },
    update: {},
    create: {
      email: 'admin@tyvashop.ru',
      password: hashedPassword,
      fullName: 'Администратор',
      role: 'ADMIN',
      isVerified: true,
    },
  });

  console.log('Admin создан:', admin.email);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
