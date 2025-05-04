const mongoose = require('mongoose');

const ContentSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true,
        maxlength: [150, 'Title cannot be more than 150 characters']
    },
    description: {
        type: String,
        required: [true, 'Please add a description'],
        trim: true,
    },
    type: {
        type: String,
        required: [true, 'Please specify content type'],
        enum: ['Video', 'Article', 'PDF', 'Quiz', 'Course', 'ExternalLink', 'Other'], // Example types
    },
    url: { // URL for external content, video embed, etc.
        type: String,
        match: [
            /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
            'Please use a valid URL with HTTP or HTTPS'
        ],
        // Required might depend on type, consider custom validation
    },
    filePath: { // Path for locally hosted files (consider cloud storage URLs instead)
        type: String,
    },
    tags: { // For categorization and recommendations
        type: [String],
        default: [],
    },
    durationMinutes: { // Optional: Estimated time to complete
        type: Number,
        min: 0,
    },
    createdBy: { // Reference to the user who uploaded/created (optional)
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        // required: true // If creator must be tracked
    },
    // Add fields for difficulty, ratings, prerequisites etc. as needed
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }
});

// Middleware to update `updatedAt` field on save/update
ContentSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Add indexes for frequently queried fields
ContentSchema.index({ title: 'text', description: 'text', tags: 1 }); // Example text index and tag index

module.exports = mongoose.model('Content', ContentSchema);
