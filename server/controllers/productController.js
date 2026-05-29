const prisma = require("../config/db");
const { z } = require("zod");

const productSchema = z.object({
  name: z.string().min(2, "Название минимум 2 символа").max(200),
  description: z.string().min(5, "Описание минимум 5 символов").max(2000),
  price: z.number().positive("Цена должна быть положительной"),
  stock: z.number().int().min(0, "Остаток не может быть отрицательным"),
  categoryId: z.number().int().positive(),
  imageUrl: z.string().optional().nullable(),
});

const sortMap = {
  price_asc: { price: "asc" },
  price_desc: { price: "desc" },
  name_asc: { name: "asc" },
  id_asc: { id: "asc" },
};

const withRating = (p) => ({
  ...p,
  avgRating: p.reviews?.length
    ? (p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length).toFixed(1)
    : null,
  reviewCount: p.reviews?.length ?? 0,
  reviews: undefined,
});

const getAllProducts = async (req, res) => {
  try {
    const { search, categoryId, page, limit = 12, sort, minPrice, maxPrice } = req.query;

    const where = {};
    if (search) where.name = { contains: search, mode: "insensitive" };
    if (categoryId) where.categoryId = Number(categoryId);
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = Number(minPrice);
      if (maxPrice) where.price.lte = Number(maxPrice);
    }

    const orderBy = sortMap[sort] || { id: "asc" };

    if (page !== undefined) {
      const pageNum = Number(page) || 1;
      const limitNum = Number(limit);
      const skip = (pageNum - 1) * limitNum;

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: { category: true, reviews: { select: { rating: true } } },
          orderBy,
          skip,
          take: limitNum,
        }),
        prisma.product.count({ where }),
      ]);

      return res.json({
        products: products.map(withRating),
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
      });
    }

    const products = await prisma.product.findMany({
      where,
      include: { category: true, reviews: { select: { rating: true } } },
      orderBy,
    });
    res.json(products.map(withRating));
  } catch (error) {
    console.error("Ошибка при получении товаров:", error);
    res.status(500).json({ message: "Не удалось получить товары" });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id: Number(id) },
      include: { category: true },
    });
    if (!product) return res.status(404).json({ message: "Товар не найден" });

    // Похожие товары (Блок 6)
    const related = await prisma.product.findMany({
      where: { categoryId: product.categoryId, id: { not: product.id } },
      include: { category: true, reviews: { select: { rating: true } } },
      take: 4,
    });

    res.json({ ...product, related: related.map(withRating) });
  } catch (error) {
    console.error("Ошибка при получении товара:", error);
    res.status(500).json({ message: "Не удалось получить товар" });
  }
};

const createProduct = async (req, res) => {
  try {
    const parsed = productSchema.safeParse({
      ...req.body,
      price: Number(req.body.price),
      stock: Number(req.body.stock),
      categoryId: Number(req.body.categoryId),
    });
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues?.[0]?.message || 'Ошибка валидации' });
    }

    const { name, description, price, stock, categoryId } = parsed.data;
    const imageUrl = req.file
      ? `/uploads/${req.file.filename}`
      : req.body.imageUrl
      ? req.body.imageUrl.trim()
      : null;

    const product = await prisma.product.create({
      data: { name: name.trim(), description: description.trim(), price, imageUrl, stock, categoryId },
      include: { category: true },
    });
    res.status(201).json(product);
  } catch (error) {
    console.error("Ошибка при создании товара:", error);
    res.status(500).json({ message: "Не удалось создать товар" });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const parsed = productSchema.safeParse({
      ...req.body,
      price: Number(req.body.price),
      stock: Number(req.body.stock),
      categoryId: Number(req.body.categoryId),
    });
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues?.[0]?.message || 'Ошибка валидации' });
    }

    const { name, description, price, stock, categoryId } = parsed.data;

    let imageUrl;
    if (req.file) {
      imageUrl = `/uploads/${req.file.filename}`;
    } else if (req.body.imageUrl !== undefined) {
      imageUrl = req.body.imageUrl ? req.body.imageUrl.trim() : null;
    } else {
      const existing = await prisma.product.findUnique({ where: { id: Number(id) }, select: { imageUrl: true } });
      imageUrl = existing?.imageUrl ?? null;
    }

    const product = await prisma.product.update({
      where: { id: Number(id) },
      data: { name: name.trim(), description: description.trim(), price, imageUrl, stock, categoryId },
      include: { category: true },
    });
    res.json(product);
  } catch (error) {
    console.error("Ошибка при обновлении товара:", error);
    res.status(500).json({ message: "Не удалось обновить товар" });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.product.delete({ where: { id: Number(id) } });
    res.json({ message: "Товар успешно удалён" });
  } catch (error) {
    console.error("Ошибка при удалении товара:", error);
    res.status(500).json({ message: "Не удалось удалить товар" });
  }
};

const getHeroImage = async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const settingsFile = path.join(__dirname, '../uploads/hero-settings.json');
    if (fs.existsSync(settingsFile)) {
      const data = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
      return res.json(data);
    }
    res.json({
      imageUrl: null,
      naadymTitle: 'НААДЫМ 2026',
      naadymSubtitle: 'Праздник трёх игр',
      naadymText: 'Национальный праздник Тывы — хуреш, стрельба из лука и конные скачки. Готовьтесь к соревнованиям с нашим снаряжением.',
      naadymPromoCode: null,
      naadymPromoText: null,
      naadymVisible: true,
    });
  } catch (e) {
    res.json({ imageUrl: null });
  }
};

const updateHeroImage = async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    const settingsFile = path.join(uploadsDir, 'hero-settings.json');

    // Читаем существующие настройки
    let existing = {};
    if (fs.existsSync(settingsFile)) {
      existing = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
    }

    const data = {
      ...existing,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : (req.body.imageUrl || existing.imageUrl || null),
      naadymTitle: req.body.naadymTitle !== undefined ? req.body.naadymTitle : existing.naadymTitle,
      naadymSubtitle: req.body.naadymSubtitle !== undefined ? req.body.naadymSubtitle : existing.naadymSubtitle,
      naadymText: req.body.naadymText !== undefined ? req.body.naadymText : existing.naadymText,
      naadymPromoCode: req.body.naadymPromoCode !== undefined ? (req.body.naadymPromoCode || null) : existing.naadymPromoCode,
      naadymPromoText: req.body.naadymPromoText !== undefined ? (req.body.naadymPromoText || null) : existing.naadymPromoText,
      naadymVisible: req.body.naadymVisible !== undefined
        ? (req.body.naadymVisible === 'true' || req.body.naadymVisible === true)
        : existing.naadymVisible,
      updatedAt: new Date().toISOString(),
    };

    fs.writeFileSync(settingsFile, JSON.stringify(data));
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Ошибка сохранения' });
  }
};

const deleteHeroImage = async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const settingsFile = path.join(__dirname, '../uploads/hero-settings.json');
    if (fs.existsSync(settingsFile)) {
      const data = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
      data.imageUrl = null;
      fs.writeFileSync(settingsFile, JSON.stringify(data));
    }
    res.json({ message: 'Баннер удалён' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Ошибка удаления баннера' });
  }
};

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct, getHeroImage, updateHeroImage, deleteHeroImage };
