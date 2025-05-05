--- a/backend/middleware/authMiddleware.js
+++ b/backend/middleware/authMiddleware.js
@@
+const jwt = require('jsonwebtoken');
+const asyncHandler = require('express-async-handler');
+const User = require('../models/User');

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');

      next();
    } catch (error) {
      console.log(error);
      res.status(401);
      throw new Error('Not authorized');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Not authorized, no token');
  }
});

module.exports = { protect };

// Middleware to protect routes requiring authentication
const protect = asyncHandler(async (req, res, next) => {
    let token;

    // Check for token in Authorization header (Bearer token)
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer ') // Ensure space after Bearer
    ) {
        try {
            // Extract token from header (Bearer TOKEN_STRING)
            token = req.headers.authorization.split(' ')[1];

            // Verify the token using the JWT_SECRET
            if (!process.env.JWT_SECRET) {
                console.error('CRITICAL: JWT_SECRET not defined in environment variables.');
                res.status(500);
                throw new Error('Server configuration error: Cannot verify token');
            }
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Find the user associated with the token's ID
            // Exclude the password field from the returned user object
            // Ensure user exists and potentially check if they are active/not banned
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                 res.status(401);
                 throw new Error('Not authorized, user associated with this token no longer exists');
            }

            // Attach user to the request object
            // req.user = user; // Already done above

            // Proceed to the next middleware or route handler
            next();
        } catch (error) {
            console.error('Token verification failed:', error.message);
             // Handle specific JWT errors more granularly
            if (error.name === 'JsonWebTokenError') {
                res.status(401);
                throw new Error('Not authorized, invalid token signature');
            } else if (error.name === 'TokenExpiredError') {
                 res.status(401);
                 throw new Error('Not authorized, token has expired');
            } else {
                 // Catch-all for other verification issues
                 res.status(401);
                 throw new Error('Not authorized, token verification failed');
            }
        }
    }

    // If no token is found in the header at all
    if (!token) {
        res.status(401);
        throw new Error('Not authorized, no token provided');
    }
});

// Middleware to authorize based on user role(s)
// Should be used *after* the 'protect' middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        // Assumes 'protect' middleware has already run and successfully set req.user
        if (!req.user) {
             // This should technically not happen if protect runs first, but good failsafe
             res.status(401);
             throw new Error('Not authorized, user not found');
        }

        if (!roles.includes(req.user.role)) {
             res.status(403); // Forbidden - User is authenticated but lacks permission
             throw new Error(`Forbidden: User role '${req.user.role}' is not authorized to access this resource`);
        }
        // User has the required role, proceed
        next();
    };
};


module.exports = { protect, authorize };
