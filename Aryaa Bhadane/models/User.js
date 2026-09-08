const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  membershipTier: {
    type: String,
    enum: ['Bronze', 'Silver', 'Gold', 'Platinum'],
    default: 'Bronze'
  },
  membershipStatus: {
    type: String,
    enum: ['active', 'expired', 'frozen'],
    default: 'active'
  },
  membershipExpiryDate: {
    type: Date,
    required: [true, 'Membership expiry date is required']
  },
  emergencyContact: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

/**
 * Pre-save Hook:
 * 1. Automatically hashes the user's password if modified.
 * 2. Checks and updates membershipStatus based on membershipExpiryDate.
 */
userSchema.pre('save', async function (next) {
  try {
    // Check if membership has passed expiry date and update status if active
    if (this.membershipExpiryDate && new Date(this.membershipExpiryDate) < new Date() && this.membershipStatus === 'active') {
      this.membershipStatus = 'expired';
    }

    // Only hash password if it has been modified or is new
    if (!this.isModified('password')) {
      return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Instance Method: Compare candidate password with hashed password
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Instance Method: Compute remaining days until membership expiry
 */
userSchema.methods.getRemainingDays = function () {
  const now = new Date();
  const expiry = new Date(this.membershipExpiryDate);
  const diffTime = expiry - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

module.exports = mongoose.model('User', userSchema);
