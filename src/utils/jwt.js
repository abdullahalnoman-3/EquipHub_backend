const jwt = require('jsonwebtoken');

// generate jwt token
const generateToken = (payload) => {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'equiphub_secret_key_2026',
    { expiresIn: '7d' }
  );
};

// cookie settings for token
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
};

module.exports = {
  generateToken,
  cookieOptions
};
