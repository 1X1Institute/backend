const mongoose = require('mongoose');

const interactionLogSchema = mongoose.Schema(
  {
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        ref: 'User',
    },
    contentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Content',
        required: true,
        ref: 'Content',
    },
    interactionType: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    },
    content: {
      type: String
    },
    question: {
      type: String
    },
    answer: {
        type: String
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('InteractionLog', interactionLogSchema);
