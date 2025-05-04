const mongoose = require('mongoose');

const InteractionLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true, // Index for faster user-specific queries
    },
    contentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Content',
        required: true,
        index: true, // Index for faster content-specific queries
    },
    interactionType: {
        type: String,
        required: true,
        enum: ['view', 'start', 'complete', 'rating', 'comment', 'search_click'], // Example interaction types
        index: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true, // Index for time-based queries
    },
    details: { // Optional field for extra data (e.g., rating value, comment text, search query)
        type: mongoose.Schema.Types.Mixed,
    },
});

// Compound index example (if often querying by user and content)
InteractionLogSchema.index({ userId: 1, contentId: 1 });

module.exports = mongoose.model('InteractionLog', InteractionLogSchema);
