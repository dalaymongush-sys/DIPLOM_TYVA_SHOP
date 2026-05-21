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

const getAllProducts = async (req, res) => {
  try {
    const { search, categoryId, page, limit = 12, sort } = req.query;

    const where = {};
    if (search) where.name = { contains: search, mode: "insensitive" };
    if (categoryId) where.categoryId = Number(categoryId);

    const orderBy = sortMap[sort] || { id: "asc" };

    if (page !== undefined) {
      const pageNum = Number(page) || 1;
      const limitNum = Number(limit);
      const skip = (pageNum - 1) * limitNum;

      const [products, total] = await Promise.all([
        prisma.product.findMany({
          where,
          include: { category: true },
          orderBy,
          skip,
          take: limitNum,
        }),
        prisma.product.count({ where }),
      ]);

      return res.json({
        products,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum),
      });
    }

    const products = await prisma.product.findMany({
      where,
      include: { category: true },
      orderBy,
    });
    res.json(products);
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
    res.json(product);
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
      return res.status(400).json({ message: parsed.error.errors[0].message });
    }

    const { name, description, price, stock, categoryId } = parsed.data;
    const imageUrl = req.file
      ? `/uploads/${req.file.filename}`
      : (req.body.imageUrl ? req.body.imageUrl.trim() : null);

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
      return res.status(400).json({ message: parsed.error.errors[0].message });
    }

    const { name, description, price, stock, categoryId } = parsed.data;

    // If new file uploaded — use it; if imageUrl text sent — use it; otherwise keep existing
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

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct };
