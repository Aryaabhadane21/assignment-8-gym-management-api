const express = require('express');
const router = express.Router();
const {
  getAllClasses,
  getClassById,
  createClass,
  bookClass,
  cancelBooking
} = require('../controllers/classController');
const { isAuthenticated } = require('../middleware/authMiddleware');
const { checkActiveMember } = require('../middleware/checkActiveMember');

// @route   GET /api/classes
// @desc    Fetch all upcoming fitness classes (supports ?trainer=John)
router.get('/', getAllClasses);

// @route   GET /api/classes/:id
// @desc    Get class details with enrolled members list
router.get('/:id', getClassById);

// @route   POST /api/classes
// @desc    Create a new workout class
router.post('/', createClass);

// @route   POST /api/classes/:id/book
// @desc    Enroll logged-in user (Fails if class is full or user membership expired)
router.post('/:id/book', isAuthenticated, checkActiveMember, bookClass);

// @route   DELETE /api/classes/:id/cancel
// @desc    Cancel member booking from class
router.delete('/:id/cancel', isAuthenticated, cancelBooking);

module.exports = router;
