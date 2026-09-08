const User = require('../models/User');

/**
 * Middleware to verify that the logged-in member has an active, unexpired membership
 */
const checkActiveMember = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const now = new Date();
    const expiryDate = new Date(user.membershipExpiryDate);

    // Check if membership is expired by date or status
    if (user.membershipStatus === 'expired' || expiryDate < now) {
      // Synchronize membershipStatus in DB if not already set to expired
      if (user.membershipStatus !== 'expired') {
        await User.findByIdAndUpdate(user._id, { membershipStatus: 'expired' });
        user.membershipStatus = 'expired';
      }

      return res.status(400).json({
        success: false,
        message: 'Membership has expired. Please renew your membership to book classes.'
      });
    }

    // Check if membership is frozen
    if (user.membershipStatus === 'frozen') {
      return res.status(400).json({
        success: false,
        message: 'Membership is currently frozen. Please contact gym administration.'
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error checking membership status',
      error: error.message
    });
  }
};

module.exports = {
  checkActiveMember
};
