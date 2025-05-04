const express = require('express');
const {
    getAllContent,
    getContentById,
    createContent,
    updateContent,
    deleteContent
} = require('../controllers/contentController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Public route to get all content or content by ID
router.route('/')
    .get(getAllContent)
    // Example: Only admins can create content
    .post(protect, authorize('admin'), createContent); // Add authorize('admin') later if needed

router.route('/:id')
    .get(getContentById)
    // Example: Only admins can update/delete content
    .put(protect, authorize('admin'), updateContent) // Add authorize('admin') later if needed
    .delete(protect, authorize('admin'), deleteContent); // Add authorize('admin') later if needed

// Add routes for specific content interactions (e.g., marking complete) if needed
// router.post('/:id/complete', protect, markContentComplete);

module.exports = router;
