const passport = require('passport');
const User = require('../models/User');

/**
 * @desc    Register a new member with calculated membership expiry
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res) => {
  try {
    const { username, email, password, membershipTier, durationMonths, emergencyContact } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide username, email, and password'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { username: username.trim() },
        { email: email.trim().toLowerCase() }
      ]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Username or email already exists'
      });
    }

    // Calculate membership expiry date: Date.now() + durationMonths * 30 days
    const months = Number(durationMonths) > 0 ? Number(durationMonths) : 1;
    const MILLISECONDS_IN_30_DAYS = 30 * 24 * 60 * 60 * 1000;
    const membershipExpiryDate = new Date(Date.now() + months * MILLISECONDS_IN_30_DAYS);

    // Create new member user
    const newUser = new User({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password, // Password hashing handled in User pre-save hook
      membershipTier: membershipTier || 'Bronze',
      membershipStatus: 'active',
      membershipExpiryDate,
      emergencyContact: emergencyContact ? emergencyContact.trim() : undefined
    });

    await newUser.save();

    const responseUser = newUser.toJSON();
    responseUser.remainingDays = newUser.getRemainingDays();

    return res.status(201).json({
      success: true,
      message: 'Member registered successfully',
      data: responseUser
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
};

/**
 * @desc    Login via Passport Local Strategy
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Internal server error during authentication',
        error: err.message
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: info ? info.message : 'Invalid credentials'
      });
    }

    req.login(user, (loginErr) => {
      if (loginErr) {
        return res.status(500).json({
          success: false,
          message: 'Error establishing session',
          error: loginErr.message
        });
      }

      const responseUser = user.toJSON();
      responseUser.remainingDays = user.getRemainingDays();

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: responseUser
      });
    });
  })(req, res, next);
};

/**
 * @desc    Fetch active member profile & remaining days
 * @route   GET /api/auth/me
 * @access  Private (Session Authenticated)
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Member profile not found'
      });
    }

    const userData = user.toJSON();
    userData.remainingDays = user.getRemainingDays();

    return res.status(200).json({
      success: true,
      data: userData
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error fetching member profile',
      error: error.message
    });
  }
};

/**
 * @desc    Logout user and clear session
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Logout failed',
        error: err.message
      });
    }
    req.session.destroy(() => {
      res.clearCookie('connect.sid');
      return res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    });
  });
};

module.exports = {
  register,
  login,
  getMe,
  logout
};
