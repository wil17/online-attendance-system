const jwt = require('jsonwebtoken');
const db = require('../config/database');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Check if user still exists and is active
      const [users] = await db.execute(
        'SELECT id, email, role, is_active FROM users WHERE id = ?',
        [decoded.userId]
      );

      if (users.length === 0 || !users[0].is_active) {
        return res.status(401).json({ message: 'Token is not valid' });
      }

      req.user = decoded;
      next();
    } catch (error) {
      res.status(401).json({ message: 'Token is not valid' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Server error in authentication' });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.' 
      });
    }
    next();
  };
};

module.exports = auth;
module.exports.authorize = authorize;