const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const categories = await prisma.category.createMany({
    data: [
      { name: "Хуреш" },
      { name: "Стрельба из лука" },
      { name: "Конные состязания" },
      { name: "Национальная атрибутика" },
      { name: "Общие спортивные товары" },
    ],
  });

  const allCategories = await prisma.category.findMany();

  const huresh = allCategories.find((c) => c.name === "Хуреш");
  const archery = allCategories.find((c) => c.name === "Стрельба из лука");
  const horse = allCategories.find((c) => c.name === "Конные состязания");
  const national = allCategories.find((c) => c.name === "Национальная атрибутика");
  const general = allCategories.find((c) => c.name === "Общие спортивные товары");

  await prisma.product.createMany({
    data: [
      {
        name: "Комплект для Хуреш",
        description: "Базовый комплект одежды для тренировок по национальной борьбе Хуреш.",
        price: 6500,
        imageUrl: "https://via.placeholder.com/300x200?text=Huresh+Set",
        stock: 10,
        categoryId: huresh.id,
      },
      {
        name: "Борцовская обувь",
        description: "Удобная обувь для тренировок и выступлений.",
        price: 4200,
        imageUrl: "https://via.placeholder.com/300x200?text=Wrestling+Shoes",
        stock: 15,
        categoryId: huresh.id,
      },
      {
        name: "Тренировочный лук",
        description: "Лук для начинающих спортсменов и учебных занятий.",
        price: 8900,
        imageUrl: "https://via.placeholder.com/300x200?text=Bow",
        stock: 7,
        categoryId: archery.id,
      },
      {
        name: "Набор стрел",
        description: "Комплект стрел для тренировочной стрельбы.",
        price: 2500,
        imageUrl: "https://via.placeholder.com/300x200?text=Arrows",
        stock: 20,
        categoryId: archery.id,
      },
      {
        name: "Седло для соревнований",
        description: "Снаряжение для конных состязаний и тренировок.",
        price: 18500,
        imageUrl: "https://via.placeholder.com/300x200?text=Saddle",
        stock: 3,
        categoryId: horse.id,
      },
      {
        name: "Национальный сувенирный шарф",
        description: "Сувенирная атрибутика с тувинскими орнаментами.",
        price: 1200,
        imageUrl: "https://via.placeholder.com/300x200?text=Scarf",
        stock: 25,
        categoryId: national.id,
      },
      {
        name: "Спортивная бутылка",
        description: "Универсальная бутылка для воды.",
        price: 700,
        imageUrl: "https://via.placeholder.com/300x200?text=Bottle",
        stock: 30,
        categoryId: general.id,
      },
    ],
  });

  await prisma.user.create({
    data: {
      email: "admin@tyvashop.ru",
      password: "12345",
      fullName: "Администратор",
      role: "ADMIN",
    },
  });

  console.log("Начальные данные успешно добавлены");
}

main()
  .catch((e) => {
    console.error("Ошибка при заполнении базы:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });