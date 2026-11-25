const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { plantImageUpload } = require('../middleware/upload');
const { detectDisease, getDiseaseHistory } = require('../controllers/diseaseController');

router.get('/history', protect, getDiseaseHistory);
router.post('/detect', protect, plantImageUpload.single('image'), detectDisease);

module.exports = router;
