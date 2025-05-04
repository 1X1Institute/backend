const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse'); // Simple error utility (optional)

// Utility function to send token response
const sendTokenResponse = (user, statusCode, res) => {
    // Create token
    const token = user.getSignedJwtToken();

    // Cookie options (optional, alternative to sending in body)
    const options = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000), // e.g., 30 days
        httpOnly: true, // Cookie cannot be accessed by client-side scripts
    };
    if (process.env.NODE_ENV === 'production') {
        options.secure = true; // Only send cookie over HTTPS in production
    }

    // Prepare user data to send back (exclude sensitive fields if necessary)
    const userData = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        interests: user.interests,
        // Add other fields needed by frontend
    };


    // Send token in response body (common for SPAs) and optionally as cookie
    res
        .status(statusCode)
        // .cookie('token', token, options) // Uncomment to send as cookie
        .json({
            success: true,
            token,
            user: userData // Send user data along with token
        });
};


// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
    const { name, email, password, role } = req.body; // Get role if allowing role selection during registration

    // Basic validation (Mongoose validation will also run)
    if (!name || !email || !password) {
         return next(new ErrorResponse('Please provide name, email, and password', 400));
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return next(new ErrorResponse('Email already registered', 400));
    }

    // Create user
    try {
        const user = await User.create({
            name,
            email,
            password,
            role // Assign role if provided and allowed, otherwise model default applies
        });

        // Don't automatically log in - require separate login step
        // sendTokenResponse(user, 200, res); // Or send token directly if desired

        res.status(201).json({ success: true, message: 'User registered successfully. Please log in.' });

    } catch (error) {
         // Handle Mongoose validation errors or other creation errors
         next(error);
    }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;

    // Validate email & password presence
    if (!email || !password) {
        return next(new ErrorResponse('Please provide an email and password', 400));
    }

    // Check for user & explicitly select password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        return next(new ErrorResponse('Invalid credentials', 401)); // Use generic message
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
        return next(new ErrorResponse('Invalid credentials', 401)); // Use generic message
    }

    // User matched, send token response
    sendTokenResponse(user, 200, res);
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
    // User is already attached to req by the 'protect' middleware
    // We refetch here in case user data changed since token was issued,
    // but req.user from middleware is often sufficient.
    const user = await User.findById(req.user.id);

    if (!user) {
        // Should not happen if protect middleware worked correctly
        return next(new ErrorResponse('User not found', 404));
    }

     // Prepare user data to send back
    const userData = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        interests: user.interests,
        // Add other fields needed by frontend
    };


    res.status(200).json({
        success: true,
        user: userData
    });
});

// @desc    Log user out / Clear cookie (Optional backend logic)
// @route   POST /api/auth/logout
// @access  Private
// exports.logout = asyncHandler(async (req, res, next) => {
//     // Option 1: If using cookies, clear the cookie
//     // res.cookie('token', 'none', {
//     //     expires: new Date(Date.now() + 10 * 1000), // Expire in 10 seconds
//     //     httpOnly: true,
//     // });

//     // Option 2: Implement a token blocklist (more complex)
//     // Add the current token JTI (JWT ID) to a Redis/DB blocklist until it expires.

//     res.status(200).json({
//         success: true,
//         message: 'User logged out successfully',
//     });
// });

