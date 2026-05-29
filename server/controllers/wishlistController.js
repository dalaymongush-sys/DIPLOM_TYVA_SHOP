const prisma = require("../config/db");

const getWishlist = async (req, res) => {
  try {
    const items = await prisma.wishlist.findMany({
      where: { userId: req.user.id },
      include: { product: { include: { category: true, reviews: { select: { rating: true } } } } },
      orderBy: { createdAt: "desc" },
    });
    // Добавляем avgRating к каждому товару
    const result = items.map((item) => ({
      ...item,
      product: {
        ...item.product,
        avgRating: item.product.reviews.length
          ? (item.product.reviews.reduce((s, r) => s + r.rating, 0) / item.product.reviews.length).toFixed(1)
          : null,
        reviewCount: item.product.reviews.length,
        reviews: undefined,
      },
    }));
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Ошибка" });
  }
};

const toggleWishlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = Number(req.params.productId);

    const existing = await prisma.wishlist.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (existing) {
      await prisma.wishlist.delete({ where: { userId_productId: { userId, productId } } });
      return res.json({ wishlisted: false });
    }

    await prisma.wishlist.create({ data: { userId, productId } });
    res.json({ wishlisted: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Ошибка" });
  }
};

module.exports = { getWishlist, toggleWishlist };
