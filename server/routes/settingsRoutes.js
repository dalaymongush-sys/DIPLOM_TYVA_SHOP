const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const upload = require('../middleware/upload');
const { getHeroImage, updateHeroImage, deleteHeroImage } = require('../controllers/productController');

router.get('/hero', getHeroImage);
router.post('/hero', authMiddleware, adminMiddleware, upload.single('image'), updateHeroImage);
router.delete('/hero', authMiddleware, adminMiddleware, deleteHeroImage);

module.exports = router;
