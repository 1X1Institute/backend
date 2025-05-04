const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Content = require('../models/Content');
const InteractionLog = require('../models/InteractionLog'); // Import InteractionLog
// const RecommendationEngine = require('../services/recommendationEngine'); // Import when logic is built

// @desc    Get personalized content recommendations
// @route   GET /api/recommendations
// @access  Private
exports.getRecommendations = asyncHandler(async (req, res, next) => {
    const userId = req.user.id; // Assuming protect middleware adds user to req
    const limit = parseInt(req.query.limit) || 5; // Allow specifying limit via query param

    // --- MVP Recommendation Logic ---
    let recommendedContentIds = [];
    let recommendationSource = 'fallback_recent'; // Track how recommendations were generated

    // 1. Get user's interests and recent interactions
    const user = await User.findById(userId);
    const recentInteractions = await InteractionLog.find({ userId: userId, interactionType: { $in: ['view', 'complete'] } })
        .sort({ timestamp: -1 })
        .limit(20) // Look at last 20 interactions
        .select('contentId');

    const interactedContentIds = recentInteractions.map(log => log.contentId.toString());
    const uniqueInteractedContentIds = [...new Set(interactedContentIds)];

    // --- Strategy 1: Based on user interests ---
    if (user && user.interests && user.interests.length > 0) {
        const interestBasedContent = await Content.find({
            tags: { $in: user.interests },
            _id: { $nin: uniqueInteractedContentIds } // Exclude already interacted content
        })
        .limit(limit)
        .select('_id');

        recommendedContentIds = interestBasedContent.map(c => c._id);
        if(recommendedContentIds.length > 0) {
            recommendationSource = 'user_interests';
        }
        console.log(`Recommendations based on interests for user ${userId}:`, recommendedContentIds);
    }

    // --- Strategy 2: Fallback to popular/recent content if needed ---
    if (recommendedContentIds.length < limit) {
         console.log(`Not enough recommendations from interests, falling back...`);
        // Fetch some popular or recently added content, excluding interacted and already recommended
        const fallbackContent = await Content.find({
             _id: { $nin: [...uniqueInteractedContentIds, ...recommendedContentIds] } // Exclude interacted and already found
        })
        .sort({ createdAt: -1 }) // Example: recent first
        // Add popularity sort later (e.g., based on interaction counts)
        .limit(limit - recommendedContentIds.length) // Fetch remaining needed
        .select('_id');

        const fallbackIds = fallbackContent.map(c => c._id);
        recommendedContentIds = [...recommendedContentIds, ...fallbackIds]; // Combine results
        if(fallbackIds.length > 0 && recommendationSource === 'fallback_recent') { // Only update source if fallback actually added something
             // Keep 'user_interests' if it contributed initially
        } else if (fallbackIds.length > 0) {
             recommendationSource += '+fallback_recent';
        }
        console.log(`Fallback recommendations added for user ${userId}:`, fallbackIds);
    }

    // --- Future Expansion ---
    // - Integrate with RecommendationEngine service
    // - Use collaborative filtering based on similar users
    // - Factor in content popularity, ratings, completion rates
    // - Call external AI recommendation API
    // recommendedContentIds = await RecommendationEngine.getRecommendations(userId, limit);

    // Fetch full content details for the final recommended IDs
    const recommendations = await Content.find({ '_id': { $in: recommendedContentIds } });

    // Optional: Sort recommendations based on original order or relevance score if available

    res.status(200).json({
        success: true,
        count: recommendations.length,
        source: recommendationSource, // Indicate how recommendations were generated
        data: recommendations,
        message: "AI-Recommended Content" // Explicitly label
    });
});
