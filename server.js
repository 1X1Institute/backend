const express = require('express');
const dotenv = require('dotenv').config();
const cors = require('cors');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const contentRoutes = require('./routes/contentRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const userInsightsRoutes = require('./routes/userInsightsRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');
const connectDB = require('./config/db');

const port = process.env.PORT || 5000;

connectDB();

const app = express();

// Enable CORS for all origins
app.use(cors());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/user-insights', userInsightsRoutes);

// Error handler middleware
app.use(errorHandler);

app.listen(port, () => console.log(`Server started on port ${port}`));
