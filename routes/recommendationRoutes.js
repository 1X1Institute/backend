const express = require('express');
const { getRecommendations } = require('../controllers/recommendationController');
const { protect } = require('../middleware/authMiddleware'); // Middleware to protect routes

const router = express.Router();

// @route   GET /api/recommendations
// @desc    Get personalized content recommendations for the logged-in user
// @access  Private (requires authentication)
router.get('/', protect, getRecommendations);

module.exports = router;
