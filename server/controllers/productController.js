const prisma = require("../config/db");

const getAllProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
      },
      orderBy: { id: "asc" },
    });

    res.json(products);
  } catch (error) {
    console.error("Ошибка при получении товаров:", error);
    res.status(500).json({ message: "Не удалось получить товары" });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, description, price, imageUrl, stock, categoryId } = req.body;

    if (!name || !description || price === undefined || !categoryId) {
      return res.status(400).json({
        message: "Поля name, description, price, categoryId обязательны",
      });
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        imageUrl: imageUrl ? imageUrl.trim() : null,
        stock: stock !== undefined ? Number(stock) : 0,
        categoryId: Number(categoryId),
      },
      include: {
        category: true,
      },
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
    const { name, description, price, imageUrl, stock, categoryId } = req.body;

    if (!name || !description || price === undefined || !categoryId) {
      return res.status(400).json({
        message: "Поля name, description, price, categoryId обязательны",
      });
    }

    const product = await prisma.product.update({
      where: {
        id: Number(id),
      },
      data: {
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        imageUrl: imageUrl ? imageUrl.trim() : null,
        stock: stock !== undefined ? Number(stock) : 0,
        categoryId: Number(categoryId),
      },
      include: {
        category: true,
      },
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

    await prisma.product.delete({
      where: {
        id: Number(id),
      },
    });

    res.json({ message: "Товар успешно удалён" });
  } catch (error) {
    console.error("Ошибка при удалении товара:", error);
    res.status(500).json({ message: "Не удалось удалить товар" });
  }
};

module.exports = {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};