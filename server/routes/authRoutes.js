const express = require("express");
const router = express.Router();

const {
  register, login, verifyEmail, resendVerification,
  verify2FA, toggle2FA,
  forgotPassword, resetPassword,
  getMe, updateMe, changePassword, updateAvatar, deleteAvatar,
} = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

router.post("/register", register);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", resendVerification);
router.post("/login", login);
router.post("/verify-2fa", verify2FA);
router.patch("/toggle-2fa", authMiddleware, toggle2FA);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/me", authMiddleware, getMe);
router.patch("/me", authMiddleware, updateMe);
router.patch("/change-password", authMiddleware, changePassword);
router.post("/avatar", authMiddleware, upload.single("avatar"), updateAvatar);
router.delete("/avatar", authMiddleware, deleteAvatar);

module.exports = router;
