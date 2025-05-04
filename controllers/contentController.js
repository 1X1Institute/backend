const asyncHandler = require('express-async-handler');
const Content = require('../models/Content');
const ErrorResponse = require('../utils/errorResponse'); // Optional error utility

// @desc    Get all content items (with basic filtering/pagination later)
// @route   GET /api/content
// @access  Public
exports.getAllContent = asyncHandler(async (req, res, next) => {
    // Basic query - add filtering, sorting, pagination later
    const contentItems = await Content.find({}) // Populate createdBy if needed: .populate('createdBy', 'name email');
        .sort({ createdAt: -1 }); // Sort by newest first

    res.status(200).json({
        success: true,
        count: contentItems.length,
        data: contentItems,
    });
});

// @desc    Get single content item by ID
// @route   GET /api/content/:id
// @access  Public
exports.getContentById = asyncHandler(async (req, res, next) => {
    const contentItem = await Content.findById(req.params.id); // Populate createdBy if needed

    if (!contentItem) {
        return next(new ErrorResponse(`Content not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
        success: true,
        data: contentItem,
    });
});

// @desc    Create new content item
// @route   POST /api/content
// @access  Private (e.g., Admin only - requires auth middleware)
exports.createContent = asyncHandler(async (req, res, next) => {
    // Add validation for required fields based on content type
    // Add user ID from authenticated user
    // req.body.createdBy = req.user.id; // Assuming protect middleware adds user

    const { title, description, type, url, tags } = req.body; // Add other fields

    if (!title || !description || !type) {
         return next(new ErrorResponse(`Please provide title, description, and type`, 400));
    }

    // Simple creation - add file upload handling if needed
    const newContent = await Content.create({
        title,
        description,
        type,
        url, // Optional
        tags, // Optional
        // createdBy: req.user.id // Assign creator if tracking
    });

    res.status(201).json({ // 201 Created status
        success: true,
        data: newContent,
    });
});

// @desc    Update content item
// @route   PUT /api/content/:id
// @access  Private (e.g., Admin or owner)
exports.updateContent = asyncHandler(async (req, res, next) => {
    let contentItem = await Content.findById(req.params.id);

    if (!contentItem) {
        return next(new ErrorResponse(`Content not found with id of ${req.params.id}`, 404));
    }

    // Authorization check: Ensure user is admin or owner (if tracking createdBy)
    // if (contentItem.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    //     return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this content`, 401));
    // }

    // Update fields provided in request body
    // Use findByIdAndUpdate with options for validation and returning new doc
    contentItem = await Content.findByIdAndUpdate(req.params.id, req.body, {
        new: true, // Return the modified document
        runValidators: true, // Run Mongoose validators on update
    });

    res.status(200).json({
        success: true,
        data: contentItem,
    });
});

// @desc    Delete content item
// @route   DELETE /api/content/:id
// @access  Private (e.g., Admin or owner)
exports.deleteContent = asyncHandler(async (req, res, next) => {
    const contentItem = await Content.findById(req.params.id);

    if (!contentItem) {
        return next(new ErrorResponse(`Content not found with id of ${req.params.id}`, 404));
    }

    // Authorization check (similar to update)
    // if (contentItem.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
    //     return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this content`, 401));
    // }

    // Use deleteOne or remove (remove is deprecated on models)
    await Content.deleteOne({ _id: req.params.id });
    // Or: await contentItem.remove(); // If you fetched the document first

    // Also consider deleting associated files from storage if applicable

    res.status(200).json({
        success: true,
        message: 'Content deleted successfully',
        data: {}, // Or return the deleted item ID
    });
});
