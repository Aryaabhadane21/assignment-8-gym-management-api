const express = require('express');
const router = express.Router();
const { register, login, getMe, logout } = require('../controllers/authController');
const { isAuthenticated } = require('../middleware/authMiddleware');

// @route   POST /api/auth/register
// @desc    Register a new member with duration and auto-expiry calculation
router.post('/register', register);

// @route   POST /api/auth/login
// @desc    Authenticate member using Passport Local Strategy & establish session
router.post('/login', login);

// @route   GET /api/auth/me
// @desc    Fetch active member profile with remaining membership days
router.get('/me', isAuthenticated, getMe);

// @route   POST /api/auth/logout
// @desc    End user session and clear cookie
router.post('/logout', isAuthenticated, logout);

module.exports = router;
