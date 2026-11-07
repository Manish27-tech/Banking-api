const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateTokens, verifyRefreshToken } = require('../utils/tokenGenerator');

// Refresh access token
router.post('/token', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(401).json({ 
        success: false,
        error: 'Refresh token required' 
      });
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(403).json({ 
        success: false,
        error: 'Invalid refresh token' 
      });
    }

    // Check if refresh token exists in database
    const user = await User.findOne({ 
      _id: decoded.userId, 
      refreshToken: refreshToken 
    });

    if (!user) {
      return res.status(403).json({ 
        success: false,
        error: 'Invalid refresh token' 
      });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id, user.email);
    
    // Update refresh token in database
    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;