const jwt = require('jsonwebtoken');
const { getCollections } = require('../config/db');

// verify jwt token middleware
const verifyToken = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    // check authorization header if not in cookies
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized access. Token not found'
      });
    }

    // verify token
    jwt.verify(token, process.env.JWT_SECRET || 'equiphub_secret_key_2026', async (err, decoded) => {
      if (err) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized access. Invalid or expired token'
        });
      }

      // get current user from database to ensure fresh role
      const { usersCollection } = getCollections();
      const user = await usersCollection.findOne({ email: decoded.email });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User account not found'
        });
      }

      // attach user to request object
      req.user = user;
      next();
    });
  } catch (error) {
    console.error('verifyToken error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Authentication failed'
    });
  }
};

// verify admin role middleware
const verifyAdmin = (req, res, next) => {
  if (req.user?.role !== 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden access. Admin only'
    });
  }
  next();
};

// verify owner role middleware (Admins have full superuser rights, including Owner capabilities)
const verifyOwner = (req, res, next) => {
  if (req.user?.role !== 'Owner' && req.user?.role !== 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden access. Equipment Owner or Admin only'
    });
  }
  next();
};

// verify renter/customer role middleware (Admins have full superuser rights, including Customer capabilities)
const verifyRenter = (req, res, next) => {
  if (req.user?.role !== 'Customer' && req.user?.role !== 'Renter' && req.user?.role !== 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Forbidden access. Renter or Admin only'
    });
  }
  next();
};

module.exports = {
  verifyToken,
  verifyAdmin,
  verifyOwner,
  verifyRenter,
  verifyCustomer: verifyRenter
};
