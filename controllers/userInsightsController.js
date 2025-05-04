const asyncHandler = require('express-async-handler');
const InteractionLog = require('../models/InteractionLog');
const ErrorResponse = require('../utils/errorResponse'); // Optional

// @desc    Get basic user insights (e.g., completed/viewed counts)
// @route   GET /api/user-insights
// @access  Private
exports.getUserInsights = asyncHandler(async (req, res, next) => {
    const userId = req.user.id; // Get user ID from protected route

    // --- MVP Insights Logic ---
    // Count completed items
    const completedCount = await InteractionLog.countDocuments({
        userId: userId,
        interactionType: 'complete',
    });

    // Count viewed items (distinct content IDs)
    // Get distinct content IDs viewed by the user
    const viewedContentIds = await InteractionLog.distinct('contentId', {
        userId: userId,
        interactionType: 'view', // Or include 'start' if that counts as viewed
    });
    const viewedCount = viewedContentIds.length;

    // --- Future Enhancements ---
    // - Calculate time spent (requires start/end interactions or duration logging)
    // - Track progress on specific courses/learning paths
    // - Identify most frequent topics/tags interacted with
    // - Compare user progress against averages (requires aggregation)

    const insights = {
        completedCount,
        viewedCount,
        // Add more calculated insights here
        // Example: lastActivity: await InteractionLog.findOne({ userId }).sort({ timestamp: -1 }).select('timestamp interactionType')
    };

    res.status(200).json({
        success: true,
        data: insights,
    });
});
