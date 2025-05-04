const express = require('express');
const { handleChat } = require('../controllers/chatbotController');
const { protect } = require('../middleware/authMiddleware'); // Optional: protect if only logged-in users can chat

const router = express.Router();

// @route   POST /api/chatbot
// @desc    Send message to chatbot and get response
// @access  Public (or Private using 'protect' middleware)
router.post('/', handleChat); // Add 'protect' if needed: router.post('/', protect, handleChat);

module.exports = router;
