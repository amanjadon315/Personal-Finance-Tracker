const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { sendOTP } = require('../utils/sendOTP');
const auth = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const signupSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).required(),
  password: Joi.string().min(6).required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const otpSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required()
});

// @route   POST /api/auth/signup
// @desc    Register new user
// @access  Public
router.post('/signup', async (req, res) => {
  try {
    // Validate input
    const { error } = signupSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details[0].message
      });
    }

    const { name, email, phone, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { phone }] 
    });
    
    if (existingUser) {
      return res.status(409).json({
        error: 'User already exists with this email or phone number'
      });
    }

    // Create new user (password will be hashed by pre-save middleware)
    const user = new User({
      name,
      email,
      phone,
      password
    });

    await user.save();

    // Generate and send OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save OTP to database
    await OTP.findOneAndUpdate(
      { email },
      {
        email,
        otp: otpCode,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
      },
      { upsert: true, new: true }
    );

    // Send OTP via email
    await sendOTP(email, otpCode, 'verify');

    res.status(201).json({
      message: 'User registered successfully. Please verify your email with the OTP sent.',
      email: user.email
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      error: 'Failed to register user',
      details: error.message
    });
  }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and activate account
// @access  Public
router.post('/verify-otp', async (req, res) => {
  try {
    // Validate input
    const { error } = otpSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details[0].message
      });
    }

    const { email, otp } = req.body;

    // Find OTP record
    const otpRecord = await OTP.findOne({ 
      email, 
      otp,
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      return res.status(400).json({
        error: 'Invalid or expired OTP'
      });
    }

    // Find and update user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Mark user as verified
    user.isVerified = true;
    await user.save();

    // Delete used OTP
    await OTP.deleteOne({ email, otp });

    // Generate JWT token
    const token = user.generateJWT();

    // Update last login
    await user.updateLastLogin();

    res.json({
      message: 'Account verified successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified
      }
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      error: 'Failed to verify OTP',
      details: error.message
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    // Validate input
    const { error } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details[0].message
      });
    }

    const { email, password } = req.body;

    // Find user and include password field
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Check if user is verified
    if (!user.isVerified) {
      // Generate new OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      await OTP.findOneAndUpdate(
        { email },
        {
          email,
          otp: otpCode,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        },
        { upsert: true, new: true }
      );

      await sendOTP(email, otpCode, 'verify');

      return res.status(403).json({
        error: 'Account not verified. New OTP sent to your email.',
        requiresVerification: true,
        email
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Generate OTP for 2FA
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    await OTP.findOneAndUpdate(
      { email },
      {
        email,
        otp: otpCode,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        purpose: 'login'
      },
      { upsert: true, new: true }
    );

    await sendOTP(email, otpCode, 'login');

    res.json({
      message: 'OTP sent to your email for verification',
      email,
      requiresOTP: true
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Failed to login',
      details: error.message
    });
  }
});

// @route   POST /api/auth/verify-login-otp
// @desc    Verify login OTP and complete login
// @access  Public
router.post('/verify-login-otp', async (req, res) => {
  try {
    const { error } = otpSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details[0].message
      });
    }

    const { email, otp } = req.body;

    // Find OTP record for login
    const otpRecord = await OTP.findOne({ 
      email, 
      otp,
      purpose: 'login',
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      return res.status(400).json({
        error: 'Invalid or expired OTP'
      });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Delete used OTP
    await OTP.deleteOne({ email, otp });

    // Generate JWT token
    const token = user.generateJWT();

    // Update last login
    await user.updateLastLogin();

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        isVerified: user.isVerified,
        preferences: user.preferences,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('Login OTP verification error:', error);
    res.status(500).json({
      error: 'Failed to verify login OTP',
      details: error.message
    });
  }
});

// @route   POST /api/auth/resend-otp
// @desc    Resend OTP
// @access  Public
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email is required'
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Generate new OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    await OTP.findOneAndUpdate(
      { email },
      {
        email,
        otp: otpCode,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      },
      { upsert: true, new: true }
    );

    await sendOTP(email, otpCode, 'resend');

    res.json({
      message: 'New OTP sent successfully'
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      error: 'Failed to resend OTP'
    });
  }
});

// @route   GET /api/auth/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch profile'
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
  try {
    const updateFields = {};
    const { name, phone, preferences } = req.body;

    if (name) updateFields.name = name;
    if (phone) updateFields.phone = phone;
    if (preferences) updateFields.preferences = { ...updateFields.preferences, ...preferences };

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Profile updated successfully',
      user
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      error: 'Failed to update profile'
    });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const newToken = user.generateJWT();
    
    res.json({
      message: 'Token refreshed successfully',
      token: newToken
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Failed to refresh token'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user (invalidate token on client side)
// @access  Private
router.post('/logout', auth, async (req, res) => {
  try {
    // In a more sophisticated setup, you might maintain a blacklist of tokens
    // For now, we'll just send a success response
    res.json({
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      error: 'Failed to logout'
    });
  }
});

module.exports = router;