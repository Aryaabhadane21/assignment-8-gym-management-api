const mongoose = require('mongoose');
const User = require('../models/User');

/**
 * @desc    Renew / extend membership expiry date
 * @route   PATCH /api/members/:id/renew
 * @access  Private (Authenticated)
 */
const renewMembership = async (req, res) => {
  try {
    const { id } = req.params;
    const { additionalMonths, tier } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        message: 'Invalid member ID format'
      });
    }

    if (!additionalMonths || Number(additionalMonths) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid number of additionalMonths (greater than 0)'
      });
    }

    const member = await User.findById(id);

    if (!member) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }

    // Renewal logic: Extend from either today or current expiry date (whichever is later)
    const currentExpiryTime = member.membershipExpiryDate ? new Date(member.membershipExpiryDate).getTime() : Date.now();
    const baseTime = Math.max(Date.now(), currentExpiryTime);
    const MILLISECONDS_IN_30_DAYS = 30 * 24 * 60 * 60 * 1000;
    const extendedExpiryDate = new Date(baseTime + Number(additionalMonths) * MILLISECONDS_IN_30_DAYS);

    member.membershipExpiryDate = extendedExpiryDate;
    member.membershipStatus = 'active';

    // Update tier if valid tier supplied
    if (tier) {
      const validTiers = ['Bronze', 'Silver', 'Gold', 'Platinum'];
      if (!validTiers.includes(tier)) {
        return res.status(400).json({
          success: false,
          message: `Invalid membership tier. Allowed tiers: ${validTiers.join(', ')}`
        });
      }
      member.membershipTier = tier;
    }

    await member.save();

    const responseMember = member.toJSON();
    responseMember.remainingDays = member.getRemainingDays();

    return res.status(200).json({
      success: true,
      message: `Membership successfully renewed for ${additionalMonths} month(s)`,
      data: responseMember
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to renew membership',
      error: error.message
    });
  }
};

/**
 * @desc    Get list of all members whose memberships have expired
 * @route   GET /api/members/expired
 * @access  Private / Public
 */
const getExpiredMembers = async (req, res) => {
  try {
    const now = new Date();

    // Query members whose expiry date is in the past OR status is marked as expired
    const expiredMembers = await User.find({
      $or: [
        { membershipExpiryDate: { $lt: now } },
        { membershipStatus: 'expired' }
      ]
    }).select('-password').sort({ membershipExpiryDate: -1 });

    const result = expiredMembers.map((member) => {
      const item = member.toJSON();
      item.remainingDays = member.getRemainingDays();
      return item;
    });

    return res.status(200).json({
      success: true,
      count: result.length,
      data: result
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve expired memberships',
      error: error.message
    });
  }
};

module.exports = {
  renewMembership,
  getExpiredMembers
};
