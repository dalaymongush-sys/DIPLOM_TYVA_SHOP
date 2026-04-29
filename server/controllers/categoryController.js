const prisma = require("../config/db");

const getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: { id: "asc" },
    });

    res.json(categories);
  } catch (error) {
    console.error("Ошибка при получении категорий:", error);
    res.status(500).json({ message: "Не удалось получить категории" });
  }
};

const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Название категории обязательно" });
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
      },
    });

    res.status(201).json(category);
  } catch (error) {
    console.error("Ошибка при создании категории:", error);
    res.status(500).json({ message: "Не удалось создать категорию" });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Название категории обязательно" });
    }

    const category = await prisma.category.update({
      where: {
        id: Number(id),
      },
      data: {
        name: name.trim(),
      },
    });

    res.json(category);
  } catch (error) {
    console.error("Ошибка при обновлении категории:", error);
    res.status(500).json({ message: "Не удалось обновить категорию" });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: {
        id: Number(id),
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    if (!category) {
      return res.status(404).json({ message: "Категория не найдена" });
    }

    if (category._count.products > 0) {
      return res.status(400).json({
        message: "Нельзя удалить категорию, в которой есть товары",
      });
    }

    await prisma.category.delete({
      where: {
        id: Number(id),
      },
    });

    res.json({ message: "Категория успешно удалена" });
  } catch (error) {
    console.error("Ошибка при удалении категории:", error);
    res.status(500).json({ message: "Не удалось удалить категорию" });
  }
};

module.exports = {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
};