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

router.get("/", getAllProducts);
router.get("/:id/reviews", getReviews);
router.post("/:id/reviews", authMiddleware, createReview);
router.get("/:id", getProductById);
router.post("/", authMiddleware, adminMiddleware, upload.single("image"), createProduct);
router.put("/:id", authMiddleware, adminMiddleware, upload.single("image"), updateProduct);
router.delete("/:id", authMiddleware, adminMiddleware, deleteProduct);

module.exports = router;
