const prisma = require("../config/db");
const { z } = require("zod");

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  text: z.string().min(5, "Отзыв минимум 5 символов").max(1000),
});

// GET /api/products/:id/reviews
const getReviews = async (req, res) => {
  try {
    const productId = Number(req.params.id);

    const reviews = await prisma.review.findMany({
      where: { productId },
      include: { user: { select: { fullName: true } } },
      orderBy: { createdAt: "desc" },
    });

    const avgRating = reviews.length
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

    res.json({ reviews, avgRating, total: reviews.length });
  } catch (error) {
    console.error("Ошибка при получении отзывов:", error);
    res.status(500).json({ message: "Не удалось получить отзывы" });
  }
};

// POST /api/products/:id/reviews
const createReview = async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const userId = req.user.id;

    const parsed = reviewSchema.safeParse({
      rating: Number(req.body.rating),
      text: req.body.text,
    });
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues?.[0]?.message || 'Ошибка валидации' });
    }

    // Проверка: пользователь покупал этот товар (не отменённый заказ)
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: { userId, status: { notIn: ["CANCELLED"] } },
      },
    });
    if (!hasPurchased) {
      return res.status(403).json({
        message: "Оставить отзыв можно только после покупки товара",
      });
    }

    // Проверка: уже есть отзыв
    const existing = await prisma.review.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (existing) {
      return res.status(400).json({ message: "Вы уже оставили отзыв на этот товар" });
    }

    const review = await prisma.review.create({
      data: { rating: parsed.data.rating, text: parsed.data.text, userId, productId },
      include: { user: { select: { fullName: true } } },
    });

    res.status(201).json(review);
  } catch (error) {
    console.error("Ошибка при создании отзыва:", error);
    res.status(500).json({ message: "Ошибка при создании отзыва" });
  }
};

// DELETE /api/reviews/:id
const deleteReview = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user.id;

    const review = await prisma.review.findUnique({ where: { id } });
    if (!review) return res.status(404).json({ message: "Отзыв не найден" });

    if (review.userId !== userId && req.user.role !== "ADMIN") {
      return res.status(403).json({ message: "Нет доступа" });
    }

    await prisma.review.delete({ where: { id } });
    res.json({ message: "Отзыв удалён" });
  } catch (error) {
    console.error("Ошибка при удалении отзыва:", error);
    res.status(500).json({ message: "Ошибка при удалении отзыва" });
  }
};

module.exports = { getReviews, createReview, deleteReview };
