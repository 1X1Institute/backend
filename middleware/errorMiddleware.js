const errorMiddleware = (err, req, res, next) => {
    // Determine status code: use err.statusCode if set, otherwise use res.statusCode if set (and not 200), default to 500
    let statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

    // Ensure statusCode is a valid HTTP error code
    if (statusCode < 400) {
        statusCode = 500;
    }

    console.error("Global Error Handler:", err); // Log the full error for debugging

    res.status(statusCode).json({
        success: false,
        error: err.message || 'Server Error',
        // Optionally include stack trace in development mode only
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = errorMiddleware;
