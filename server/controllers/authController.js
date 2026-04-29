const prisma = require("../config/db");
const jwt = require("jsonwebtoken");

const register = async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({
        message: "Поля email, password и fullName обязательны",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Пользователь с таким email уже существует",
      });
    }

    const user = await prisma.user.create({
      data: {
        email: email.trim(),
        password: password.trim(),
        fullName: fullName.trim(),
        role: "USER",
      },
    });

    res.status(201).json({
      message: "Регистрация успешна",
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Ошибка при регистрации:", error);
    res.status(500).json({ message: "Не удалось зарегистрировать пользователя" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Поля email и password обязательны",
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim() },
    });

    if (!user || user.password !== password.trim()) {
      return res.status(400).json({
        message: "Неверный email или пароль",
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Вход выполнен",
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Ошибка при входе:", error);
    res.status(500).json({ message: "Не удалось выполнить вход" });
  }
};

module.exports = {
  register,
  login,
};