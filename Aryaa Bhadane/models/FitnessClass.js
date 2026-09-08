const mongoose = require('mongoose');

const fitnessClassSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Class title is required'],
    trim: true
  },
  trainerName: {
    type: String,
    required: [true, 'Trainer name is required'],
    trim: true
  },
  scheduleDate: {
    type: Date,
    required: [true, 'Class schedule date is required']
  },
  durationMinutes: {
    type: Number,
    required: [true, 'Duration in minutes is required'],
    default: 60,
    min: [15, 'Duration must be at least 15 minutes']
  },
  maxCapacity: {
    type: Number,
    required: [true, 'Maximum class capacity is required'],
    min: [1, 'Class capacity must be at least 1']
  },
  enrolledMembers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      delete ret.__v;
      return ret;
    }
  },
  toObject: { virtuals: true }
});

// Virtual for currently enrolled count
fitnessClassSchema.virtual('enrolledCount').get(function () {
  return this.enrolledMembers ? this.enrolledMembers.length : 0;
});

// Virtual for remaining available seats
fitnessClassSchema.virtual('availableSeats').get(function () {
  const enrolled = this.enrolledMembers ? this.enrolledMembers.length : 0;
  return Math.max(0, this.maxCapacity - enrolled);
});

// Virtual boolean to check if class is full
fitnessClassSchema.virtual('isFull').get(function () {
  const enrolled = this.enrolledMembers ? this.enrolledMembers.length : 0;
  return enrolled >= this.maxCapacity;
});

module.exports = mongoose.model('FitnessClass', fitnessClassSchema);
