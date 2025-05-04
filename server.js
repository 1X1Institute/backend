require('dotenv').config(); // Load environment variables first
const express = require('express');
const cors = require('cors');
const path = require('path'); // Needed if serving static files later
const connectDB = require('./config/db');
const errorMiddleware = require('./middleware/errorMiddleware');

// Import routes
const authRoutes = require('./routes/authRoutes');
const contentRoutes = require('./routes/contentRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const userInsightsRoutes = require('./routes/userInsightsRoutes');

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing for all origins (adjust for production)
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: false })); // Parse URL-encoded bodies

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/user-insights', userInsightsRoutes);

// --- Simple health check endpoint ---
app.get('/health', (req, res) => res.status(200).json({ status: 'OK' }));

// --- Basic placeholder for Privacy Policy/AI Literacy Info ---
// Consider moving this to a dedicated route or serving static HTML later
app.get('/about-ai', (req, res) => {
    res.json({
        title: "About AI Features",
        description: "This platform uses AI to personalize your learning experience (recommendations) and provide quick answers (chatbot).",
        limitations: "AI is a tool and may not always be 100% accurate. Use recommendations and chatbot responses as guidance.",
        privacy_note: "Your interaction data is used solely to improve your experience within this platform. See our full Privacy Policy for details."
    });
});

// --- Serve Frontend in Production (Optional) ---
// Uncomment if you want the Node server to also serve the React build
/*
if (process.env.NODE_ENV === 'production') {
    // Set static folder (assuming frontend build is in ../frontend/build)
    app.use(express.static(path.join(__dirname, '../frontend/build')));

    // Serve index.html for any route not handled by API
    app.get('*', (req, res) =>
        res.sendFile(path.resolve(__dirname, '../frontend/build', 'index.html'))
    );
} else {
    app.get('/', (req, res) => {
        res.send('API is running in development mode...');
    });
}
*/


// --- Global Error Handler Middleware (Must be last) ---
app.use(errorMiddleware);

const PORT = process.env.PORT || 5001; // Use port from env or default

app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`));


// --- File: backend/config/db.js ---

const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Ensure MONGO_URI is set in your .env file
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI not defined in environment variables');
        }
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1); // Exit process with failure
    }
};

module.exports = connectDB;


// --- File: backend/config/index.js ---
// Central config export (currently empty, can add more later)
// Example: Load other config files or constants

module.exports = {
    // Add shared configuration constants if needed
    // e.g., ROLES: ['user', 'admin']
};
