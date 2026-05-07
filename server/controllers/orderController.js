const prisma = require("../config/db");

const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Некорректные данные заказа" });
    }

    // Проверяем наличие и получаем реальные цены из БД
    const productsFromDB = [];
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: Number(item.id) } });
      if (!product) {
        return res.status(400).json({ message: `Товар не найден` });
      }
      if (product.stock < Number(item.quantity)) {
        return res.status(400).json({
          message: `Товар "${product.name}" недоступен в нужном количестве`,
        });
      }
      productsFromDB.push({ ...product, requestedQuantity: Number(item.quantity) });
    }

    // Пересчитываем итог по реальным ценам из БД
    const realTotal = productsFromDB.reduce(
      (sum, p) => sum + p.price * p.requestedQuantity,
      0
    );

    const order = await prisma.order.create({
      data: {
        userId: Number(userId),
        totalPrice: realTotal,
        status: "NEW",
        items: {
          create: productsFromDB.map((p) => ({
            productId: p.id,
            quantity: p.requestedQuantity,
            price: p.price,
          })),
        },
      },
      include: {
        items: { include: { product: true } },
        user: true,
      },
    });

    for (const p of productsFromDB) {
      await prisma.product.update({
        where: { id: p.id },
        data: { stock: { decrement: p.requestedQuantity } },
      });
    }

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
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
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
      include: { user: true, items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
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
    if (!status) return res.status(400).json({ message: "Статус обязателен" });

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

const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = Number(req.user.id);

    const order = await prisma.order.findUnique({ where: { id: Number(id) } });
    if (!order) return res.status(404).json({ message: "Заказ не найден" });
    if (order.userId !== userId) return res.status(403).json({ message: "Нет доступа" });
    if (!["NEW", "PROCESSING"].includes(order.status)) {
      return res.status(400).json({ message: "Заказ нельзя отменить на этом этапе" });
    }

    const orderItems = await prisma.orderItem.findMany({ where: { orderId: Number(id) } });
    for (const item of orderItems) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }

    const updated = await prisma.order.update({
      where: { id: Number(id) },
      data: { status: "CANCELLED" },
    });
    res.json(updated);
  } catch (error) {
    console.error("Ошибка при отмене заказа:", error);
    res.status(500).json({ message: "Ошибка отмены заказа" });
  }
};

module.exports = { createOrder, getMyOrders, getAllOrders, updateOrderStatus, cancelOrder };
