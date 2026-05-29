const prisma = require('../config/db');

// Получить все промокоды (только для админа)
const getAllPromos = async (req, res) => {
  try {
    const promos = await prisma.promoCode.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(promos);
  } catch (e) {
    res.status(500).json({ message: 'Ошибка' });
  }
};

// Создать промокод (только для админа)
const createPromo = async (req, res) => {
  try {
    const { code, discount, usageLimit, expiresAt, isActive } = req.body;
    if (!code || !discount) {
      return res.status(400).json({ message: 'Код и скидка обязательны' });
    }
    if (discount < 1 || discount > 100) {
      return res.status(400).json({ message: 'Скидка должна быть от 1 до 100%' });
    }
    const existing = await prisma.promoCode.findUnique({ where: { code: code.toUpperCase() } });
    if (existing) {
      return res.status(400).json({ message: 'Промокод с таким кодом уже существует' });
    }
    const promo = await prisma.promoCode.create({
      data: {
        code: code.toUpperCase().trim(),
        discount: Number(discount),
        usageLimit: usageLimit ? Number(usageLimit) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: isActive !== false,
      },
    });
    res.status(201).json(promo);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'Ошибка создания промокода' });
  }
};

// Обновить промокод (только для админа)
const updatePromo = async (req, res) => {
  try {
    const { id } = req.params;
    const { discount, usageLimit, expiresAt, isActive } = req.body;
    const promo = await prisma.promoCode.update({
      where: { id: Number(id) },
      data: {
        discount: discount ? Number(discount) : undefined,
        usageLimit: usageLimit !== undefined ? (usageLimit ? Number(usageLimit) : null) : undefined,
        expiresAt: expiresAt !== undefined ? (expiresAt ? new Date(expiresAt) : null) : undefined,
        isActive: isActive !== undefined ? isActive : undefined,
      },
    });
    res.json(promo);
  } catch (e) {
    res.status(500).json({ message: 'Ошибка обновления' });
  }
};

// Удалить промокод (только для админа)
const deletePromo = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.promoCode.delete({ where: { id: Number(id) } });
    res.json({ message: 'Промокод удалён' });
  } catch (e) {
    res.status(500).json({ message: 'Ошибка удаления' });
  }
};

// Проверить промокод (для пользователей)
const validatePromo = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'Введите промокод' });

    const promo = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase().trim() },
    });

    if (!promo) {
      return res.status(404).json({ message: 'Промокод не найден' });
    }
    if (!promo.isActive) {
      return res.status(400).json({ message: 'Промокод неактивен' });
    }
    if (promo.expiresAt && new Date() > new Date(promo.expiresAt)) {
      return res.status(400).json({ message: 'Срок действия промокода истёк' });
    }
    if (promo.usageLimit && promo.usageCount >= promo.usageLimit) {
      return res.status(400).json({ message: 'Промокод исчерпан' });
    }

    res.json({
      valid: true,
      code: promo.code,
      discount: promo.discount,
      message: `Скидка ${promo.discount}% применена!`,
    });
  } catch (e) {
    res.status(500).json({ message: 'Ошибка проверки промокода' });
  }
};

module.exports = { getAllPromos, createPromo, updatePromo, deletePromo, validatePromo };
