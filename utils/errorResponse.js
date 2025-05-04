// Simple utility class for creating structured error responses

class ErrorResponse extends Error {
    constructor(message, statusCode) {
        super(message); // Call the parent Error constructor
        this.statusCode = statusCode; // Add a statusCode property

        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

module.exports = ErrorResponse;

