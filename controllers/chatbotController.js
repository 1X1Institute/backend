const asyncHandler = require('express-async-handler');
const AIService = require('../services/aiService'); // For future integration
const ErrorResponse = require('../utils/errorResponse'); // Optional

// @desc    Handle chatbot interaction
// @route   POST /api/chatbot
// @access  Public or Private (adjust as needed)
exports.handleChat = asyncHandler(async (req, res, next) => {
    const { message } = req.body;
    const userId = req.user ? req.user.id : 'guest'; // Identify user if logged in (requires protect middleware)

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return next(new ErrorResponse('Message is required and must be a non-empty string', 400));
    }

    const trimmedMessage = message.trim();
    let responseText = "I'm sorry, I can only answer basic questions right now.";
    let responseSource = "basic_keywords"; // Track response source

    // --- MVP Chatbot Logic (Simple Keyword Matching) ---
    const lowerCaseMessage = trimmedMessage.toLowerCase();

    // Define simple keyword responses
    const keywordResponses = {
        'hello': "Hello! How can I help you today?",
        'hi': "Hi there! What can I do for you?",
        'recommend': "You can find AI-recommended content on your dashboard.",
        'content': "Browse available content from the main dashboard or search.",
        'help': "You can browse content or check your dashboard. For technical issues, please contact support@example.com.",
        'support': "For technical support, please email support@example.com.",
        'privacy': "We use your data to personalize your learning. See our Privacy Policy for details.",
        'bye': "Goodbye! Have a great day.",
        'thank': "You're welcome!",
        // Add more simple keywords/responses
    };

    // Find the first matching keyword
    for (const keyword in keywordResponses) {
        if (lowerCaseMessage.includes(keyword)) {
            responseText = keywordResponses[keyword];
            break; // Use the first match found
        }
    }

    // --- Future Expansion ---
    // try {
    //     // Example: Call an external AI service if basic keywords don't match
    //     if (responseText === "I'm sorry, I can only answer basic questions right now.") {
    //          responseText = await AIService.getChatbotResponse(trimmedMessage, userId);
    //          responseSource = "external_ai_service";
    //     }
    // } catch (aiError) {
    //     console.error("AI Service Error:", aiError);
    //     // Keep the default apology message or provide a specific error message
    //     responseText = "Sorry, I couldn't connect to the advanced AI assistant right now.";
    //     responseSource = "ai_service_error";
    // }

    res.status(200).json({
        success: true,
        query: trimmedMessage, // Echo back the user's message
        response: responseText,
        source: responseSource, // Indicate how the response was generated
        disclaimer: "Please note: I am an AI assistant. Information may not be 100% factual and should be used as a reference only." // Add disclaimer
    });
});
