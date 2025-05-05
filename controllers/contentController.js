const asyncHandler = require('express-async-handler');
const Content = require('../models/Content');
const InteractionLog = require('../models/InteractionLog');
// const ErrorResponse = require('../utils/errorResponse'); // Example for custom error class

// --- Helper Function for Query Features ---
const applyQueryFeatures = (modelQuery, queryString) => {
    let query = modelQuery;
    const reqQuery = { ...queryString };

    // Fields to exclude from direct filtering (handled separately)
    const removeFields = ['select', 'sort', 'page', 'limit'];
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string with MongoDB operators ($gt, $in, etc.)
    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // --- Filtering ---
    query = query.find(JSON.parse(queryStr));

    // --- Field Selection (Projection) ---
    if (queryString.select) {
        const fields = queryString.select.split(',').join(' ');
        query = query.select(fields);
    } else {
        query = query.select('-__v'); // Exclude __v by default
    }

    // --- Sorting ---
    if (queryString.sort) {
        const sortBy = queryString.sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else {
        query = query.sort('-createdAt'); // Default sort by newest
    }

    // --- Pagination ---
    const page = parseInt(queryString.page, 10) || 1;
    const limit = parseInt(queryString.limit, 10) || 25; // Default limit of 25
    const skip = (page - 1) * limit;

    query = query.skip(skip).limit(limit);

    return query;
};

// @desc    Get all content items with filtering, sorting, pagination
// @route   GET /api/content
// @access  Public
exports.getAllContent = asyncHandler(async (req, res, next) => {
    const query = applyQueryFeatures(Content.find().populate('createdBy', 'name'), req.query); // Populate creator name
    const contentItems = await query;

    // Optional: Get total count for pagination metadata
    const total = await Content.countDocuments(query.getFilter()); // Get filter used by the query

    res.status(200).json({
        success: true,
        count: contentItems.length, // Count for the current page
        pagination: { // Basic pagination info
            total: total,
            limit: parseInt(req.query.limit, 10) || 25,
            page: parseInt(req.query.page, 10) || 1,
        },
        data: contentItems,
    });
});

// @desc    Get a single content item by ID
// @route   GET /api/content/:id
// @access  Public
exports.getContentById = asyncHandler(async (req, res, next) => {
    const content = await Content.findById(req.params.id).populate('createdBy', 'name'); // Populate creator name

    if (!content) {
        res.status(404);
        throw new Error(`Content not found with ID: ${req.params.id}`);
        // Alternatively: return next(new ErrorResponse(`Content not found with ID: ${req.params.id}`, 404));
    }

    res.status(200).json({
        success: true,
        data: content,
    });
});

// @desc    Create a new content item
// @route   POST /api/content
// @access  Private (Example: Admin only - controlled by route middleware)
exports.createContent = asyncHandler(async (req, res, next) => {
    // Add the ID of the logged-in user (from protect middleware) as the creator
    req.body.createdBy = req.user.id;

    const newContent = await Content.create(req.body);

    if (!newContent) {
         res.status(400); // Or 500 if it's unexpected
         throw new Error('Failed to create content item');
    }

    console.log(`Content created: ${newContent.title} (ID: ${newContent.id}) by User: ${req.user.id}`);
    res.status(201).json({ // 201 Created
        success: true,
        data: newContent,
    });
});

// @desc    Update an existing content item by ID
// @route   PUT /api/content/:id
// @access  Private (Example: Admin only)
exports.updateContent = asyncHandler(async (req, res, next) => {
    let content = await Content.findById(req.params.id);

    if (!content) {
        res.status(404);
        throw new Error(`Content not found with ID: ${req.params.id}`);
    }

    // Optional: Add authorization check if needed (e.g., only creator or admin can update)
    // if (content.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    //     res.status(403);
    //     throw new Error('User not authorized to update this content');
    // }

    // Remove fields that shouldn't be updated directly via PUT (like createdBy, viewCount)
    delete req.body.createdBy;
    delete req.body.viewCount;
    delete req.body.completionCount;
    delete req.body.createdAt; // Let Mongoose handle timestamps

    content = await Content.findByIdAndUpdate(req.params.id, req.body, {
        new: true, // Return the updated document
        runValidators: true, // Run schema validations on update
    });

     if (!content) {
        // Should be caught by the initial findById, but good failsafe
        res.status(404);
        throw new Error(`Content not found with ID: ${req.params.id}`);
    }


    console.log(`Content updated: ${content.title} (ID: ${content.id}) by User: ${req.user.id}`);
    res.status(200).json({
        success: true,
        data: content,
    });
});

// @desc    Delete a content item by ID
// @route   DELETE /api/content/:id
// @access  Private (Example: Admin only)
exports.deleteContent = asyncHandler(async (req, res, next) => {
    const content = await Content.findById(req.params.id);

    if (!content) {
        res.status(404);
        throw new Error(`Content not found with ID: ${req.params.id}`);
    }

    // Optional: Authorization check (similar to update)

    await content.deleteOne(); // Use deleteOne() instance method

    // Optional: Delete associated interaction logs (handle with care)
    // await InteractionLog.deleteMany({ contentId: req.params.id });

    console.log(`Content deleted: ${content.title} (ID: ${content.id}) by User: ${req.user.id}`);
    res.status(200).json({ // Can also use 204 No Content, but 200 with success message is common
        success: true,
        message: `Content '${content.title}' deleted successfully`,
        data: {}, // Or return the deleted item ID: { deletedId: req.params.id }
    });
});


// @desc    Log a user interaction with content (e.g., view, complete)
// @route   POST /api/content/:id/interact
// @access  Private (requires authentication)
exports.logContentInteraction = asyncHandler(async (req, res, next) => {
    const contentId = req.params.id;
    const userId = req.user.id;
    const { interactionType, details, ratingValue, commentText, searchQuery } = req.body; // Include specific fields

    // Validate interactionType
    const allowedTypes = ['view', 'start', 'complete', 'rating', 'comment', 'search_click', 'bookmark', 'share'];
    if (!interactionType || !allowedTypes.includes(interactionType.toLowerCase())) {
        res.status(400);
        throw new Error(`Invalid interactionType provided. Must be one of: ${allowedTypes.join(', ')}`);
    }

    // Check if the content item exists
    const contentExists = await Content.findById(contentId);
    if (!contentExists) {
        res.status(404);
        throw new Error(`Content not found with ID: ${contentId}`);
    }

     // Prepare interaction data
     const interactionData = {
        userId,
        contentId,
        interactionType: interactionType.toLowerCase(),
        details: details || {}, // Default to empty object if no generic details
        // Add specific fields based on type
        ...(interactionType.toLowerCase() === 'rating' && ratingValue && { ratingValue }),
        ...(interactionType.toLowerCase() === 'comment' && commentText && { commentText }),
        ...(interactionType.toLowerCase() === 'search_click' && searchQuery && { searchQuery }),
     };


    // Create the interaction log entry
    const logEntry = await InteractionLog.create(interactionData);

    // Optional: Update content viewCount or completionCount based on interaction type
    if (interactionType.toLowerCase() === 'view') {
        // Use $inc to atomically increment the count
        await Content.findByIdAndUpdate(contentId, { $inc: { viewCount: 1 } });
    } else if (interactionType.toLowerCase() === 'complete') {
         await Content.findByIdAndUpdate(contentId, { $inc: { completionCount: 1 } });
    }

    console.log(`Interaction logged: User ${userId}, Content ${contentId}, Type ${interactionType}`);
    res.status(201).json({ // 201 Created
        success: true,
        message: 'Interaction logged successfully',
        data: logEntry, // Return the created log entry
    });
});


// --- Placeholder for File Upload Controller ---
// exports.uploadContentFile = asyncHandler(async (req, res, next) => {
//   // Implementation using multer or similar library for file handling
//   res.status(501).json({ success: false, error: 'File upload route not implemented yet' });
// });
const asyncHandler = require('express-async-handler');
const Content = require('../models/Content');
const InteractionLog = require('../models/InteractionLog');
// const ErrorResponse = require('../utils/errorResponse'); // Example for custom error class

// --- Helper Function for Query Features ---
const applyQueryFeatures = (modelQuery, queryString) => {
    let query = modelQuery;
    const reqQuery = { ...queryString };

    // Fields to exclude from direct filtering (handled separately)
    const removeFields = ['select', 'sort', 'page', 'limit'];
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string with MongoDB operators ($gt, $in, etc.)
    let queryStr = JSON.stringify(reqQuery);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // --- Filtering ---
    query = query.find(JSON.parse(queryStr));

    // --- Field Selection (Projection) ---
    if (queryString.select) {
        const fields = queryString.select.split(',').join(' ');
        query = query.select(fields);
    } else {
        query = query.select('-__v'); // Exclude __v by default
    }

    // --- Sorting ---
    if (queryString.sort) {
        const sortBy = queryString.sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else {
        query = query.sort('-createdAt'); // Default sort by newest
    }

    // --- Pagination ---
    const page = parseInt(queryString.page, 10) || 1;
    const limit = parseInt(queryString.limit, 10) || 25; // Default limit of 25
    const skip = (page - 1) * limit;

    query = query.skip(skip).limit(limit);

    return query;
};

// @desc    Get all content items with filtering, sorting, pagination
// @route   GET /api/content
// @access  Public
exports.getAllContent = asyncHandler(async (req, res, next) => {
    const query = applyQueryFeatures(Content.find().populate('createdBy', 'name'), req.query); // Populate creator name
    const contentItems = await query;

    // Optional: Get total count for pagination metadata
    const total = await Content.countDocuments(query.getFilter()); // Get filter used by the query

    res.status(200).json({
        success: true,
        count: contentItems.length, // Count for the current page
        pagination: { // Basic pagination info
            total: total,
            limit: parseInt(req.query.limit, 10) || 25,
            page: parseInt(req.query.page, 10) || 1,
        },
        data: contentItems,
    });
});

// @desc    Get a single content item by ID
// @route   GET /api/content/:id
// @access  Public
exports.getContentById = asyncHandler(async (req, res, next) => {
    const content = await Content.findById(req.params.id).populate('createdBy', 'name'); // Populate creator name

    if (!content) {
        res.status(404);
        throw new Error(`Content not found with ID: ${req.params.id}`);
        // Alternatively: return next(new ErrorResponse(`Content not found with ID: ${req.params.id}`, 404));
    }

    res.status(200).json({
        success: true,
        data: content,
    });
});

// @desc    Create a new content item
// @route   POST /api/content
// @access  Private (Example: Admin only - controlled by route middleware)
exports.createContent = asyncHandler(async (req, res, next) => {
    // Add the ID of the logged-in user (from protect middleware) as the creator
    req.body.createdBy = req.user.id;

    const newContent = await Content.create(req.body);

    if (!newContent) {
         res.status(400); // Or 500 if it's unexpected
         throw new Error('Failed to create content item');
    }

    console.log(`Content created: ${newContent.title} (ID: ${newContent.id}) by User: ${req.user.id}`);
    res.status(201).json({ // 201 Created
        success: true,
        data: newContent,
    });
});

// @desc    Update an existing content item by ID
// @route   PUT /api/content/:id
// @access  Private (Example: Admin only)
exports.updateContent = asyncHandler(async (req, res, next) => {
    let content = await Content.findById(req.params.id);

    if (!content) {
        res.status(404);
        throw new Error(`Content not found with ID: ${req.params.id}`);
    }

    // Optional: Add authorization check if needed (e.g., only creator or admin can update)
    // if (content.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    //     res.status(403);
    //     throw new Error('User not authorized to update this content');
    // }

    // Remove fields that shouldn't be updated directly via PUT (like createdBy, viewCount)
    delete req.body.createdBy;
    delete req.body.viewCount;
    delete req.body.completionCount;
    delete req.body.createdAt; // Let Mongoose handle timestamps

    content = await Content.findByIdAndUpdate(req.params.id, req.body, {
        new: true, // Return the updated document
        runValidators: true, // Run schema validations on update
    });

     if (!content) {
        // Should be caught by the initial findById, but good failsafe
        res.status(404);
        throw new Error(`Content not found with ID: ${req.params.id}`);
    }


    console.log(`Content updated: ${content.title} (ID: ${content.id}) by User: ${req.user.id}`);
    res.status(200).json({
        success: true,
        data: content,
    });
});

// @desc    Delete a content item by ID
// @route   DELETE /api/content/:id
// @access  Private (Example: Admin only)
exports.deleteContent = asyncHandler(async (req, res, next) => {
    const content = await Content.findById(req.params.id);

    if (!content) {
        res.status(404);
        throw new Error(`Content not found with ID: ${req.params.id}`);
    }

    // Optional: Authorization check (similar to update)

    await content.deleteOne(); // Use deleteOne() instance method

    // Optional: Delete associated interaction logs (handle with care)
    // await InteractionLog.deleteMany({ contentId: req.params.id });

    console.log(`Content deleted: ${content.title} (ID: ${content.id}) by User: ${req.user.id}`);
    res.status(200).json({ // Can also use 204 No Content, but 200 with success message is common
        success: true,
        message: `Content '${content.title}' deleted successfully`,
        data: {}, // Or return the deleted item ID: { deletedId: req.params.id }
    });
});


// @desc    Log a user interaction with content (e.g., view, complete)
// @route   POST /api/content/:id/interact
// @access  Private (requires authentication)
exports.logContentInteraction = asyncHandler(async (req, res, next) => {
    const contentId = req.params.id;
    const userId = req.user.id;
    const { interactionType, details, ratingValue, commentText, searchQuery } = req.body; // Include specific fields

    // Validate interactionType
    const allowedTypes = ['view', 'start', 'complete', 'rating', 'comment', 'search_click', 'bookmark', 'share'];
    if (!interactionType || !allowedTypes.includes(interactionType.toLowerCase())) {
        res.status(400);
        throw new Error(`Invalid interactionType provided. Must be one of: ${allowedTypes.join(', ')}`);
    }

    // Check if the content item exists
    const contentExists = await Content.findById(contentId);
    if (!contentExists) {
        res.status(404);
        throw new Error(`Content not found with ID: ${contentId}`);
    }

     // Prepare interaction data
     const interactionData = {
        userId,
        contentId,
        interactionType: interactionType.toLowerCase(),
        details: details || {}, // Default to empty object if no generic details
        // Add specific fields based on type
        ...(interactionType.toLowerCase() === 'rating' && ratingValue && { ratingValue }),
        ...(interactionType.toLowerCase() === 'comment' && commentText && { commentText }),
        ...(interactionType.toLowerCase() === 'search_click' && searchQuery && { searchQuery }),
     };


    // Create the interaction log entry
    const logEntry = await InteractionLog.create(interactionData);

    // Optional: Update content viewCount or completionCount based on interaction type
    if (interactionType.toLowerCase() === 'view') {
        // Use $inc to atomically increment the count
        await Content.findByIdAndUpdate(contentId, { $inc: { viewCount: 1 } });
    } else if (interactionType.toLowerCase() === 'complete') {
         await Content.findByIdAndUpdate(contentId, { $inc: { completionCount: 1 } });
    }

    console.log(`Interaction logged: User ${userId}, Content ${contentId}, Type ${interactionType}`);
    res.status(201).json({ // 201 Created
        success: true,
        message: 'Interaction logged successfully',
        data: logEntry, // Return the created log entry
    });
});


// --- Placeholder for File Upload Controller ---
// exports.uploadContentFile = asyncHandler(async (req, res, next) => {
//   // Implementation using multer or similar library for file handling
//   res.status(501).json({ success: false, error: 'File upload route not implemented yet' });
// });
