
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [ // Basic email format validation
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email',
        ],
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false, // Don't return password by default when querying users
    },
    role: { // Example role field
        type: String,
        enum: ['user', 'admin'], // Define possible roles
        default: 'user',
    },
    interests: { // For basic recommendations
        type: [String],
        default: [],
    },
    // Add other profile fields as needed (e.g., department, completedCourses: [mongoose.Schema.Types.ObjectId])
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// --- Mongoose Middleware ---

// Encrypt password using bcrypt before saving a new user or when password is modified
UserSchema.pre('save', async function (next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error); // Pass error to the next middleware/error handler
    }
});

// --- Mongoose Methods ---

// Method to compare entered password with hashed password in DB
UserSchema.methods.matchPassword = async function (enteredPassword) {
    // 'this.password' will be available here even though select: false is set,
    // because this method is called on a document instance where the password was explicitly included or is being saved.
    // If querying and needing password, use .select('+password')
    if (!this.password) return false; // Should not happen if password is required
    return await bcrypt.compare(enteredPassword, this.password);
};

// Method for generating JWT token
UserSchema.methods.getSignedJwtToken = function () {
    if (!process.env.JWT_SECRET || !process.env.JWT_EXPIRE) {
        throw new Error('JWT Secret or Expiration not defined in environment variables');
    }
    return jwt.sign(
        { id: this._id }, // Payload: typically user ID, maybe role
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
    );
};

module.exports = mongoose.model('User', UserSchema);
