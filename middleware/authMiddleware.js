const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User'); // Assuming User model exists

// Protect routes - verifies JWT token
const protect = asyncHandler(async (req, res, next) => {
    let token;

    // Check for token in Authorization header (Bearer token)
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header (split 'Bearer' and token)
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token payload (id) and attach to request
            // Exclude password field from being attached
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                 // Handle case where user associated with token no longer exists
                 res.status(401);
                 throw new Error('Not authorized, user not found');
            }

            next(); // Proceed to the next middleware/route handler
        } catch (error) {
            console.error('Token verification failed:', error.message);
            res.status(401); // Unauthorized
            throw new Error('Not authorized, token failed');
        }
    }

    if (!token) {
        res.status(401); // Unauthorized
        throw new Error('Not authorized, no token');
    }
});

// Middleware for role-based access (Example)
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) { // Assuming user model has a 'role' field
            res.status(403); // Forbidden
            throw new Error(`User role ${req.user?.role || 'none'} is not authorized to access this route`);
        }
        next();
    };
};


module.exports = { protect, authorize };
