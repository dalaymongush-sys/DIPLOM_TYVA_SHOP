const prisma = require("../config/db");
const { sendOrderStatusUpdate } = require("../services/emailService");

const createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { items, promoCode } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Некорректные данные заказа" });
    }

    // Проверяем и применяем промокод
    let discount = 0;
    let promoId = null;

    if (promoCode) {
      const promo = await prisma.promoCode.findUnique({
        where: { code: promoCode.toUpperCase().trim() },
      });
      if (promo && promo.isActive &&
          (!promo.expiresAt || new Date() <= new Date(promo.expiresAt)) &&
          (!promo.usageLimit || promo.usageCount < promo.usageLimit)) {
        discount = promo.discount;
        promoId = promo.id;
      }
    }

    // Поддерживаем как { id, quantity } так и { productId, quantity }
    const productsFromDB = [];
    for (const item of items) {
      const productId = Number(item.productId || item.id);
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (!product) return res.status(400).json({ message: "Товар не найден" });
      if (product.stock < Number(item.quantity)) {
        return res.status(400).json({ message: `Товар "${product.name}" недоступен в нужном количестве` });
      }
      productsFromDB.push({ ...product, requestedQuantity: Number(item.quantity) });
    }

    let realTotal = productsFromDB.reduce((sum, p) => sum + p.price * p.requestedQuantity, 0);

    // Применяем скидку
    if (discount > 0) {
      realTotal = Math.round(realTotal * (1 - discount / 100));
    }

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
      include: { items: { include: { product: true } }, user: true },
    });

    for (const p of productsFromDB) {
      await prisma.product.update({
        where: { id: p.id },
        data: { stock: { decrement: p.requestedQuantity } },
      });
    }

    // Увеличиваем счётчик использования промокода
    if (promoId) {
      await prisma.promoCode.update({
        where: { id: promoId },
        data: { usageCount: { increment: 1 } },
      });
    }

    // Email-уведомление о новом заказе
    sendOrderStatusUpdate(
      order.user.email,
      order.user.fullName,
      order.id,
      "NEW",
      order.items,
      order.totalPrice
    ).catch((err) => console.error("Email error:", err));

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
    const { search } = req.query;
    const where = search
      ? {
          OR: [
            { user: { fullName: { contains: search, mode: "insensitive" } } },
            ...(!isNaN(search) ? [{ id: Number(search) }] : []),
          ],
        }
      : {};

    const orders = await prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            phone: true,
            city: true,
            street: true,
            house: true,
            apartment: true,
          }
        },
        items: { include: { product: true } },
      },
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
      include: { user: true, items: { include: { product: true } } },
    });

    sendOrderStatusUpdate(
      order.user.email,
      order.user.fullName,
      order.id,
      status,
      order.items,
      order.totalPrice
    ).catch((err) => console.error("Email error:", err));

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

// БЛОК 8 — Статистика
const getStats = async (req, res) => {
  try {
    const [
      totalOrders,
      totalRevenue,
      newOrders,
      totalUsers,
      topProducts,
      recentOrders,
      ordersByStatus,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { totalPrice: true },
        where: { status: { notIn: ["CANCELLED"] } },
      }),
      prisma.order.count({ where: { status: "NEW" } }),
      prisma.user.count({ where: { role: "USER" } }),
      prisma.orderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { user: { select: { fullName: true } } },
      }),
      prisma.order.groupBy({ by: ["status"], _count: { id: true } }),
    ]);

    const topProductIds = topProducts.map((p) => p.productId);
    const topProductDetails = await prisma.product.findMany({
      where: { id: { in: topProductIds } },
      select: { id: true, name: true, price: true },
    });

    const topProductsWithDetails = topProducts.map((tp) => ({
      ...tp,
      product: topProductDetails.find((p) => p.id === tp.productId),
    }));

    res.json({
      totalOrders,
      totalRevenue: totalRevenue._sum.totalPrice || 0,
      newOrders,
      totalUsers,
      topProducts: topProductsWithDetails,
      recentOrders,
      ordersByStatus,
    });
  } catch (error) {
    console.error("Ошибка статистики:", error);
    res.status(500).json({ message: "Не удалось получить статистику" });
  }
};

// БЛОК 9 — Экспорт CSV
const exportOrdersCSV = async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      include: { user: true, items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
    });

    const rows = [
      ["№ заказа", "Дата", "Покупатель", "Email", "Товары", "Сумма", "Статус"],
      ...orders.map((o) => [
        o.id,
        new Date(o.createdAt).toLocaleDateString("ru-RU"),
        o.user?.fullName || "",
        o.user?.email || "",
        o.items.map((i) => `${i.product?.name} x${i.quantity}`).join("; "),
        o.totalPrice,
        o.status,
      ]),
    ];

    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const bom = "﻿";

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="orders.csv"');
    res.send(bom + csv);
  } catch (error) {
    console.error("Ошибка экспорта:", error);
    res.status(500).json({ message: "Ошибка экспорта" });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  getStats,
  exportOrdersCSV,
};
