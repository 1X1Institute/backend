--- a/backend/routes/recommendationRoutes.js
+++ b/backend/routes/recommendationRoutes.js

const express = require('express');
const router = express.Router();
const { getRecommendations } = require('../controllers/recommendationController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getRecommendations);

module.exports = router;
