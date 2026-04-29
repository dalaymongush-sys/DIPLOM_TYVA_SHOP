const prisma = require("../config/db");

const createOrder = async (req, res) => {
  try {
    const { userId, items, totalPrice } = req.body;

    if (!userId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Некорректные данные заказа" });
    }

    const order = await prisma.order.create({
      data: {
        userId: Number(userId),
        totalPrice: Number(totalPrice),
        status: "NEW",
        items: {
          create: items.map((item) => ({
            productId: Number(item.id),
            quantity: Number(item.quantity),
            price: Number(item.price),
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    });

    res.status(201).json(order);
  } catch (error) {
    console.error("Ошибка при создании заказа:", error);
    res.status(500).json({ message: "Не удалось создать заказ" });
  }
};

const getMyOrders = async (req, res) => {
  try {
    const userId = Number(req.user.id);

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(orders);
  } catch (error) {
    console.error("Ошибка при получении заказов пользователя:", error);
    res.status(500).json({ message: "Не удалось получить заказы" });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.json(orders);
  } catch (error) {
    console.error("Ошибка при получении всех заказов:", error);
    res.status(500).json({ message: "Не удалось получить заказы" });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Статус обязателен" });
    }

    const order = await prisma.order.update({
      where: { id: Number(id) },
      data: { status },
    });

    res.json(order);
  } catch (error) {
    console.error("Ошибка при обновлении статуса заказа:", error);
    res.status(500).json({ message: "Не удалось обновить статус заказа" });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
};