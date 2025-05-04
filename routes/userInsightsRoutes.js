const express = require('express');
const { getUserInsights } = require('../controllers/userInsightsController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   GET /api/user-insights
// @desc    Get basic insights/progress for the logged-in user
// @access  Private
router.get('/', protect, getUserInsights);

// Add more specific insight routes if needed later
// e.g., GET /api/user-insights/completed-courses

module.exports = router;
