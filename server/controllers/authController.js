const prisma = require("../config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const dns = require("dns").promises;
const { z } = require("zod");
const {
  sendVerificationCode,
  sendWelcomeEmail,
  sendResetCode,
  sendTwoFactorCode,
} = require("../services/emailService");

const registerSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z
    .string()
    .min(8, "Пароль минимум 8 символов")
    .regex(/[A-Z]/, "Пароль должен содержать заглавную букву")
    .regex(/[0-9]/, "Пароль должен содержать цифру"),
  fullName: z.string().min(2, "ФИО минимум 2 символа").max(100),
});

const loginSchema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(1, "Введите пароль"),
});

const generateCode = () => String(Math.floor(100000 + Math.random() * 900000));

const validateEmailDomain = async (email) => {
  try {
    const domain = email.split("@")[1];
    const records = await dns.resolveMx(domain);
    return records && records.length > 0;
  } catch {
    return false;
  }
};

const makeToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

// ─── REGISTER ────────────────────────────────────────────────
const register = async (req, res) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues?.[0]?.message || 'Ошибка валидации' });
    }

    const { email, password, fullName } = parsed.data;

    // Проверка существования домена email (dev-mode: пропускаем если нет сети)
    try {
      const domainValid = await validateEmailDomain(email);
      if (!domainValid) {
        return res.status(400).json({ message: "Email адрес не существует или домен недоступен" });
      }
    } catch {
      // Если DNS недоступен — пропускаем проверку
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      if (!existingUser.isVerified) {
        const code = generateCode();
        const expiry = new Date(Date.now() + 15 * 60 * 1000);
        await prisma.user.update({
          where: { email },
          data: { verificationCode: code, verificationExpiry: expiry },
        });
        await sendVerificationCode(email, code);
        return res.status(200).json({ message: "Код отправлен повторно", needsVerification: true, email });
      }
      return res.status(400).json({ message: "Пользователь с таким email уже существует" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const code = generateCode();
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.create({
      data: {
        email: email.trim(),
        password: hashedPassword,
        fullName: fullName.trim(),
        role: "USER",
        isVerified: false,
        verificationCode: code,
        verificationExpiry: expiry,
      },
    });

    await sendVerificationCode(email, code);

    res.status(201).json({
      message: "Код подтверждения отправлен на email",
      needsVerification: true,
      email,
    });
  } catch (error) {
    console.error("Ошибка при регистрации:", error);
    res.status(500).json({ message: "Не удалось зарегистрировать пользователя" });
  }
};

// ─── VERIFY EMAIL ─────────────────────────────────────────────
const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ message: "Email и код обязательны" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ message: "Пользователь не найден" });
    if (user.isVerified) return res.status(400).json({ message: "Email уже подтверждён" });

    if (!user.verificationCode || user.verificationCode !== code) {
      return res.status(400).json({ message: "Неверный код подтверждения" });
    }
    if (new Date() > new Date(user.verificationExpiry)) {
      return res.status(400).json({ message: "Код истёк. Зарегистрируйтесь повторно" });
    }

    await prisma.user.update({
      where: { email },
      data: { isVerified: true, verificationCode: null, verificationExpiry: null },
    });

    sendWelcomeEmail(email, user.fullName).catch(console.error);

    // Автовход после верификации
    const token = makeToken(user);
    res.json({
      message: "Email подтверждён! Добро пожаловать!",
      token,
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
    });
  } catch (error) {
    console.error("Ошибка верификации:", error);
    res.status(500).json({ message: "Ошибка верификации" });
  }
};

// ─── LOGIN ────────────────────────────────────────────────────
const login = async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: parsed.error.issues?.[0]?.message || 'Ошибка валидации' });
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email: email.trim() } });
    if (!user) {
      return res.status(400).json({ message: "Неверный email или пароль" });
    }

    const isValid = await bcrypt.compare(password.trim(), user.password);
    if (!isValid) {
      return res.status(400).json({ message: "Неверный email или пароль" });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Подтвердите email перед входом",
        needsVerification: true,
        email: user.email,
      });
    }

    // 2FA
    if (user.twoFactorEnabled) {
      const code = generateCode();
      const expiry = new Date(Date.now() + 10 * 60 * 1000);
      await prisma.user.update({
        where: { id: user.id },
        data: { twoFactorCode: code, twoFactorExpiry: expiry },
      });
      await sendTwoFactorCode(user.email, code);
      return res.json({ requires2FA: true, email: user.email });
    }

    const token = makeToken(user);
    res.json({
      message: "Вход выполнен",
      token,
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
    });
  } catch (error) {
    console.error("Ошибка при входе:", error);
    res.status(500).json({ message: "Не удалось выполнить вход" });
  }
};

// ─── VERIFY 2FA ───────────────────────────────────────────────
const verify2FA = async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.twoFactorCode !== code) {
      return res.status(400).json({ message: "Неверный код" });
    }
    if (new Date() > new Date(user.twoFactorExpiry)) {
      return res.status(400).json({ message: "Код истёк" });
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorCode: null, twoFactorExpiry: null },
    });
    const token = makeToken(user);
    res.json({ token, user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role } });
  } catch (error) {
    console.error("Ошибка 2FA:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// ─── TOGGLE 2FA ───────────────────────────────────────────────
const toggle2FA = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { twoFactorEnabled: !user.twoFactorEnabled },
    });
    res.json({ twoFactorEnabled: updated.twoFactorEnabled });
  } catch (error) {
    console.error("Ошибка toggle 2FA:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// ─── RESEND VERIFICATION ─────────────────────────────────────
const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email обязателен" });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.isVerified) {
      return res.json({ message: "Если аккаунт найден — код отправлен повторно" });
    }
    const code = generateCode();
    const expiry = new Date(Date.now() + 15 * 60 * 1000);
    await prisma.user.update({ where: { email }, data: { verificationCode: code, verificationExpiry: expiry } });
    await sendVerificationCode(email, code);
    res.json({ message: "Новый код отправлен на email" });
  } catch (error) {
    console.error("Ошибка resendVerification:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// ─── FORGOT PASSWORD ──────────────────────────────────────────
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email обязателен" });

    const user = await prisma.user.findUnique({ where: { email } });
    // Не сообщаем существует ли email — защита от перебора
    if (!user) {
      return res.json({ message: "Если аккаунт существует — код отправлен на email" });
    }

    const code = generateCode();
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: { resetCode: code, resetCodeExpiry: expiry },
    });

    await sendResetCode(email, code);

    res.json({ message: "Если аккаунт существует — код отправлен на email" });
  } catch (error) {
    console.error("Ошибка forgot password:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// ─── RESET PASSWORD ───────────────────────────────────────────
const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: "Заполните все поля" });
    }
    if (newPassword.length < 8) return res.status(400).json({ message: "Пароль минимум 8 символов" });
    if (!/[A-Z]/.test(newPassword)) return res.status(400).json({ message: "Нужна заглавная буква" });
    if (!/[0-9]/.test(newPassword)) return res.status(400).json({ message: "Нужна цифра" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.resetCode || user.resetCode !== code) {
      return res.status(400).json({ message: "Неверный код" });
    }
    if (new Date() > new Date(user.resetCodeExpiry)) {
      return res.status(400).json({ message: "Код истёк" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { email },
      data: { password: hashed, resetCode: null, resetCodeExpiry: null },
    });

    res.json({ message: "Пароль успешно изменён" });
  } catch (error) {
    console.error("Ошибка reset password:", error);
    res.status(500).json({ message: "Ошибка сервера" });
  }
};

// ─── GET ME ───────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, email: true, fullName: true, phone: true,
        city: true, street: true, house: true, apartment: true,
        role: true, avatarUrl: true, twoFactorEnabled: true,
      },
    });
    if (!user) return res.status(404).json({ message: "Пользователь не найден" });
    res.json(user);
  } catch (error) {
    console.error("Ошибка получения профиля:", error);
    res.status(500).json({ message: "Не удалось получить профиль" });
  }
};

// ─── UPDATE ME ────────────────────────────────────────────────
const updateMe = async (req, res) => {
  try {
    const { fullName, phone, city, street, house, apartment } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        fullName: fullName ? fullName.trim() : undefined,
        phone: phone !== undefined ? (phone ? phone.trim() : null) : undefined,
        city: city !== undefined ? (city || null) : undefined,
        street: street !== undefined ? (street ? street.trim() : null) : undefined,
        house: house !== undefined ? (house ? house.trim() : null) : undefined,
        apartment: apartment !== undefined ? (apartment ? apartment.trim() : null) : undefined,
      },
      select: {
        id: true, email: true, fullName: true, phone: true,
        city: true, street: true, house: true, apartment: true,
        role: true, avatarUrl: true, twoFactorEnabled: true,
      },
    });
    res.json(user);
  } catch (error) {
    console.error("Ошибка обновления профиля:", error);
    res.status(500).json({ message: "Не удалось обновить профиль" });
  }
};

// ─── CHANGE PASSWORD ──────────────────────────────────────────
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ message: "Заполните все поля" });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: "Новый пароль минимум 8 символов" });
    }
    if (!/[A-Z]/.test(newPassword)) {
      return res.status(400).json({ message: "Новый пароль должен содержать заглавную букву" });
    }
    if (!/[0-9]/.test(newPassword)) {
      return res.status(400).json({ message: "Новый пароль должен содержать цифру" });
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) {
      return res.status(400).json({ message: "Неверный текущий пароль" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });

    res.json({ message: "Пароль успешно изменён" });
  } catch (error) {
    console.error("Ошибка смены пароля:", error);
    res.status(500).json({ message: "Ошибка смены пароля" });
  }
};

// ─── UPDATE AVATAR ────────────────────────────────────────────
const updateAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Файл не загружен" });
    const avatarUrl = `/uploads/${req.file.filename}`;
    await prisma.user.update({ where: { id: req.user.id }, data: { avatarUrl } });
    res.json({ avatarUrl });
  } catch (error) {
    console.error("Ошибка загрузки аватара:", error);
    res.status(500).json({ message: "Не удалось загрузить аватар" });
  }
};

// ─── DELETE AVATAR ────────────────────────────────────────────
const deleteAvatar = async (req, res) => {
  try {
    await prisma.user.update({ where: { id: req.user.id }, data: { avatarUrl: null } });
    res.json({ message: "Аватар удалён" });
  } catch (error) {
    console.error("Ошибка удаления аватара:", error);
    res.status(500).json({ message: "Не удалось удалить аватар" });
  }
};

module.exports = {
  register, login, verifyEmail, resendVerification,
  verify2FA, toggle2FA,
  forgotPassword, resetPassword,
  getMe, updateMe, changePassword, updateAvatar, deleteAvatar,
};
