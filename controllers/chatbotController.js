const asyncHandler = require('express-async-handler');
const InteractionLog = require('../models/InteractionLog');

// @desc    Process Chatbot interaction
// @route   POST /api/chatbot/process
// @access  Private
const processChatbotInteraction = asyncHandler(async (req, res) => {
  const { contentId, question, answer } = req.body;

  if (!question || !answer) {
    res.status(400);
    throw new Error('Please add all fields');
  }

  // Create interaction log
  const interactionLog = await InteractionLog.create({
    user: req.user.id,
    contentId: contentId,
    interactionType: 'question',
    question: question,
    answer: answer
  });

  if (interactionLog) {
    res.status(201).json(interactionLog);
  } else {
    res.status(400);
    throw new Error('Invalid interaction data');
  }
});

module.exports = { processChatbotInteraction };
