const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const {
  getAllPromos, createPromo, updatePromo, deletePromo, validatePromo
} = require('../controllers/promoController');

// Публичный — проверка промокода
router.post('/validate', validatePromo);

// Только для админа
router.get('/', authMiddleware, adminMiddleware, getAllPromos);
router.post('/', authMiddleware, adminMiddleware, createPromo);
router.patch('/:id', authMiddleware, adminMiddleware, updatePromo);
router.delete('/:id', authMiddleware, adminMiddleware, deletePromo);

module.exports = router;
