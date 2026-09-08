const mongoose = require('mongoose');
const FitnessClass = require('../models/FitnessClass');

/**
 * @desc    Fetch all fitness classes (supports ?trainer=John query filter)
 * @route   GET /api/classes
 * @access  Public
 */
const getAllClasses = async (req, res) => {
  try {
    const { trainer } = req.query;
    const filter = {};

    // Filter by trainer name if query parameter provided (case-insensitive)
    if (trainer) {
      filter.trainerName = { $regex: new RegExp(trainer.trim(), 'i') };
    }

    const classes = await FitnessClass.find(filter)
      .populate('enrolledMembers', 'username email membershipTier membershipStatus')
      .sort({ scheduleDate: 1 });

    return res.status(200).json({
      success: true,
      count: classes.length,
      data: classes
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch fitness classes',
      error: error.message
    });
  }
};

/**
 * @desc    Get class details with enrolled members list
 * @route   GET /api/classes/:id
 * @access  Public
 */
const getClassById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Invalid class ID format'
      });
    }

    const fitnessClass = await FitnessClass.findById(id)
      .populate('enrolledMembers', 'username email membershipTier membershipStatus');

    if (!fitnessClass) {
      return res.status(404).json({
        success: false,
        message: 'Fitness class not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: fitnessClass
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch class details',
      error: error.message
    });
  }
};

/**
 * @desc    Create a new workout class
 * @route   POST /api/classes
 * @access  Private / Public (as per spec)
 */
const createClass = async (req, res) => {
  try {
    const { title, trainerName, scheduleDate, durationMinutes, maxCapacity } = req.body;

    // Validate required fields
    if (!title || !trainerName || !scheduleDate || maxCapacity === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title, trainerName, scheduleDate, and maxCapacity'
      });
    }

    if (Number(maxCapacity) < 1) {
      return res.status(400).json({
        success: false,
        message: 'Class maxCapacity must be at least 1'
      });
    }

    const newClass = new FitnessClass({
      title: title.trim(),
      trainerName: trainerName.trim(),
      scheduleDate: new Date(scheduleDate),
      durationMinutes: durationMinutes ? Number(durationMinutes) : 60,
      maxCapacity: Number(maxCapacity),
      enrolledMembers: []
    });

    await newClass.save();

    return res.status(201).json({
      success: true,
      message: 'Fitness class created successfully',
      data: newClass
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
      message: 'Failed to create fitness class',
      error: error.message
    });
  }
};

/**
 * @desc    Enroll logged-in user into a class (with capacity and duplicate check)
 * @route   POST /api/classes/:id/book
 * @access  Private (Authenticated & Active Member)
 */
const bookClass = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Invalid class ID format'
      });
    }

    const fitnessClass = await FitnessClass.findById(id);

    if (!fitnessClass) {
      return res.status(404).json({
        success: false,
        message: 'Fitness class not found'
      });
    }

    // Check if user is already enrolled
    const isAlreadyEnrolled = fitnessClass.enrolledMembers.some(
      (memberId) => memberId.toString() === userId.toString()
    );

    if (isAlreadyEnrolled) {
      return res.status(400).json({
        success: false,
        message: 'You are already enrolled in this class'
      });
    }

    // Capacity check: Reject if class capacity is reached
    if (fitnessClass.enrolledMembers.length >= fitnessClass.maxCapacity) {
      return res.status(400).json({
        success: false,
        message: 'Class capacity reached'
      });
    }

    // Enroll member
    fitnessClass.enrolledMembers.push(userId);
    await fitnessClass.save();

    const updatedClass = await FitnessClass.findById(id)
      .populate('enrolledMembers', 'username email membershipTier membershipStatus');

    return res.status(200).json({
      success: true,
      message: 'Successfully enrolled in class',
      data: updatedClass
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to book class',
      error: error.message
    });
  }
};

/**
 * @desc    Cancel member booking from class
 * @route   DELETE /api/classes/:id/cancel
 * @access  Private (Authenticated)
 */
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Invalid class ID format'
      });
    }

    const fitnessClass = await FitnessClass.findById(id);

    if (!fitnessClass) {
      return res.status(404).json({
        success: false,
        message: 'Fitness class not found'
      });
    }

    // Check if user is currently enrolled
    const isEnrolled = fitnessClass.enrolledMembers.some(
      (memberId) => memberId.toString() === userId.toString()
    );

    if (!isEnrolled) {
      return res.status(400).json({
        success: false,
        message: 'You are not enrolled in this class'
      });
    }

    // Remove user from enrolledMembers
    fitnessClass.enrolledMembers = fitnessClass.enrolledMembers.filter(
      (memberId) => memberId.toString() !== userId.toString()
    );

    await fitnessClass.save();

    const updatedClass = await FitnessClass.findById(id)
      .populate('enrolledMembers', 'username email membershipTier');

    return res.status(200).json({
      success: true,
      message: 'Class booking cancelled successfully',
      data: updatedClass
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel class booking',
      error: error.message
    });
  }
};

module.exports = {
  getAllClasses,
  getClassById,
  createClass,
  bookClass,
  cancelBooking
};
