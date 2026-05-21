const express = require("express");
const router = express.Router();
const { deleteReview } = require("../controllers/reviewController");
const authMiddleware = require("../middleware/authMiddleware");

router.delete("/:id", authMiddleware, deleteReview);

module.exports = router;
