const express = require('express');
const router = express.Router();
const {
  renewMembership,
  getExpiredMembers
} = require('../controllers/memberController');
const { isAuthenticated } = require('../middleware/authMiddleware');

// @route   GET /api/members/expired
// @desc    Get list of all expired memberships (placed before /:id to avoid param shadowing)
router.get('/expired', getExpiredMembers);

// @route   PATCH /api/members/:id/renew
// @desc    Renew / extend membership expiry date
router.patch('/:id/renew', isAuthenticated, renewMembership);

module.exports = router;
