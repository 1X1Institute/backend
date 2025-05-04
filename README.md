# AI LXP MVP - Backend

This directory contains the Node.js/Express backend code for the AI-Enabled Learning Experience Platform (LXP) Minimum Viable Product (MVP).

## Features

* User Authentication (Register, Login with JWT)
* Content Metadata Management (Basic CRUD placeholders)
* AI-Powered Recommendations (Placeholder logic based on interests/popularity)
* AI Chatbot (Placeholder logic with basic keyword matching)
* User Insights (Placeholder logic for basic interaction counts)
* RESTful API endpoints

## Technology Stack

* **Runtime:** Node.js
* **Framework:** Express.js
* **Database:** MongoDB (with Mongoose ODM)
* **Authentication:** JSON Web Tokens (JWT)
* **Environment Variables:** `dotenv`
* **CORS:** `cors`
* **Password Hashing:** `bcryptjs`
* **Async Handling:** `express-async-handler`

## Setup

1.  **Clone the repository:** (If applicable, once you create it)
    ```bash
    git clone <your-repository-url>
    cd lxp-mvp/backend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up environment variables:**
    * Copy `.env.example` to a new file named `.env`:
        ```bash
        cp .env.example .env
        ```
    * Edit the `.env` file and provide your specific configuration (Database URI, JWT Secret, etc.).
        **Important:** Choose a strong, unique `JWT_SECRET`.

4.  **Run the server:**
    * For production:
        ```bash
        npm start
        ```
    * For development (with automatic restarts using nodemon):
        ```bash
        npm run dev
        ```

The server should start, typically on port 5001 (or the port specified in your `.env` file).

## API Endpoints

(Document your API endpoints here as they are developed)

* `POST /api/auth/register` - Register a new user
* `POST /api/auth/login` - Login a user, returns JWT
* `GET /api/auth/me` - Get current logged-in user profile (Protected)
* `GET /api/content` - Get list of content items
* `GET /api/content/:id` - Get specific content item
* `GET /api/recommendations` - Get AI-powered recommendations (Protected)
* `POST /api/chatbot` - Interact with the AI chatbot
* `GET /api/user-insights` - Get basic user progress insights (Protected)
* `GET /health` - Health check endpoint

## Project Structure

```
backend/
├── config/         # Database connection, environment config
├── controllers/    # Request handling logic
├── middleware/     # Custom middleware (auth, error handling)
├── models/         # Mongoose schemas/models
├── routes/         # API route definitions
├── services/       # Business logic, external API interactions (AI)
├── .env.example    # Example environment variables
├── .gitignore      # Files/folders to ignore in Git (add node_modules, .env)
├── package.json    # Project metadata and dependencies
├── README.md       # This file
└── server.js       # Main application entry point
```

## TODO / Future Enhancements

* Implement full CRUD operations for content.
* Develop actual recommendation algorithms (ML models, collaborative filtering).
* Integrate with a real NLP service for the chatbot.
* Expand user insights and reporting.
* Add comprehensive error handling and logging.
* Implement unit and integration tests.
* Set up cloud storage for content files (e.g., S3).
* Add administrative interfaces.
