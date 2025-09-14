const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    let token = req.header('Authorization');
    
    if (!token) {
      return res.status(401).json({ 
        error: 'No token provided, access denied' 
      });
    }

    // Remove 'Bearer ' from token if present
    if (token.startsWith('Bearer ')) {
      token = token.slice(7);
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return res.status(401).json({ 
          error: 'User not found, token invalid' 
        });
      }

      if (!user.isVerified) {
        return res.status(403).json({ 
          error: 'Account not verified' 
        });
      }

      // Add user to request object
      req.user = {
        id: user._id,
        email: user.email,
        name: user.name
      };
      
      next();
    } catch (tokenError) {
      console.error('Token verification error:', tokenError);
      
      if (tokenError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Token expired',
          expired: true 
        });
      }
      
      if (tokenError.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          error: 'Invalid token' 
        });
      }
      
      throw tokenError;
    }
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      error: 'Server error in authentication' 
    });
  }
};

// Optional auth middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    let token = req.header('Authorization');
    
    if (!token || !token.startsWith('Bearer ')) {
      return next();
    }

    token = token.slice(7);
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);
      
      if (user && user.isVerified) {
        req.user = {
          id: user._id,
          email: user.email,
          name: user.name
        };
      }
    } catch (tokenError) {
      // Silently fail for optional auth
      console.log('Optional auth token error:', tokenError.message);
    }
    
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next();
  }
};

module.exports = { auth, optionalAuth };