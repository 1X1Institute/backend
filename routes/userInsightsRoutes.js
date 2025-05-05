--- a/backend/controllers/userInsightsController.js
+++ b/backend/controllers/userInsightsController.js

+const asyncHandler = require('express-async-handler');
+const InteractionLog = require('../models/InteractionLog');

// @desc    Get User Insights
// @route   GET /api/user-insights
// @access  Private
const getUserInsights = asyncHandler(async (req, res) => {
  const interactions = await InteractionLog.find({ user: req.user.id });
  res.status(200).json(interactions);
});

module.exports = { getUserInsights };
