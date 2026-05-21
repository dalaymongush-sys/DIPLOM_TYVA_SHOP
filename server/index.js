const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const path = require("path");
require("dotenv").config();

const categoryRoutes = require("./routes/categoryRoutes");
const productRoutes = require("./routes/productRoutes");
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");
const reviewRoutes = require("./routes/reviewRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:5173",
  credentials: true,
}));
app.use(morgan("dev"));
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Слишком много попыток. Попробуйте через 15 минут." },
});
app.use("/api/auth", authLimiter);

app.get("/", (req, res) => {
  res.send("Сервер интернет-магазина работает");
});

app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/products", productRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);

app.use("/api", (req, res) => {
  res.status(404).json({ message: `Маршрут ${req.method} ${req.path} не найден` });
});

app.use((err, req, res, next) => {
  console.error("Необработанная ошибка:", err);
  res.status(500).json({ message: "Внутренняя ошибка сервера" });
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
