const express = require("express");
const router = express.Router();

const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const upload = require("../middleware/upload");
const { getReviews, createReview } = require("../controllers/reviewController");
const prisma = require("../config/db");

router.get("/", getAllProducts);
router.get("/:id/reviews", getReviews);
router.post("/:id/reviews", authMiddleware, createReview);
router.get("/:id", getProductById);
router.post("/", authMiddleware, adminMiddleware, upload.single("image"), createProduct);
router.put("/:id", authMiddleware, adminMiddleware, upload.single("image"), updateProduct);
router.delete("/:id", authMiddleware, adminMiddleware, deleteProduct);

// POST /api/products/:id/images — добавить дополнительное фото
router.post("/:id/images", authMiddleware, adminMiddleware, upload.single("image"), async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ message: "Файл не загружен" });
    const imageUrl = req.file.path;
    const product = await prisma.product.findUnique({ where: { id: Number(id) } });
    if (!product) return res.status(404).json({ message: "Товар не найден" });
    const images = [...(product.images || []), imageUrl];
    const updated = await prisma.product.update({
      where: { id: Number(id) },
      data: { images },
      include: { category: true },
    });
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Ошибка загрузки фото" });
  }
});

// DELETE /api/products/:id/images — удалить фото из массива
router.delete("/:id/images", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { imageUrl } = req.body;
    const product = await prisma.product.findUnique({ where: { id: Number(id) } });
    if (!product) return res.status(404).json({ message: "Товар не найден" });
    const images = (product.images || []).filter((img) => img !== imageUrl);
    const updated = await prisma.product.update({
      where: { id: Number(id) },
      data: { images },
      include: { category: true },
    });
    res.json(updated);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Ошибка удаления фото" });
  }
});

module.exports = router;
