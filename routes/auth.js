const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Account = require('../models/Account');
const { generateTokens } = require('../utils/tokenGenerator');

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, accountType = 'savings' } = req.body;

    // Validate required fields
    if (!fullName || !email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Full name, email and password are required' 
      });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        error: 'Email already registered' 
      });
    }

    // Create user first
    const user = new User({ fullName, email, password });
    await user.save();

    // Create account for user (accountNumber will be auto-generated)
    const account = new Account({ 
      userId: user._id, 
      accountType 
    });
    
    // Save account to trigger pre('save') middleware
    await account.save();

    // Update user with account number
    user.accountNumber = account.accountNumber;
    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id, user.email);
    
    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          accountNumber: account.accountNumber
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Email and password are required' 
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }

    // Check if account is locked
    if (user.isLocked && user.isLocked()) {
      const remainingTime = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(401).json({ 
        success: false,
        error: `Account locked. Try again in ${remainingTime} minutes` 
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Increment login attempts
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      
      // Lock account after 5 failed attempts
      if (user.loginAttempts >= 5) {
        user.lockUntil = Date.now() + 15 * 60 * 1000; // Lock for 15 minutes
      }
      
      await user.save();
      
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0;
    user.lockUntil = undefined;

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user._id, user.email);
    
    // Save refresh token
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          accountNumber: user.accountNumber
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// Logout user
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (refreshToken) {
      const user = await User.findOne({ refreshToken });
      if (user) {
        user.refreshToken = null;
        await user.save();
      }
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

module.exports = router;