const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getUserInsights } = require('../controllers/userInsightsController');

router.get('/', protect, getUserInsights);

module.exports = router;
