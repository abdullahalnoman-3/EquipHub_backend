const bcrypt = require('bcryptjs');
const { getCollections } = require('../config/db');
const { createUserObject } = require('../models/user.model');
const { generateToken, cookieOptions } = require('../utils/jwt');

// register new user
const registerUser = async (req, res) => {
  try {
    const { name, email, password, photoURL, phone, address, role } = req.body;

    // validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    // password validation: min 6 chars, uppercase and lowercase letter
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const isLongEnough = password.length >= 6;

    if (!hasUpperCase || !hasLowerCase || !isLongEnough) {
      return res.status(400).json({
        success: false,
        message: 'Password must have at least one uppercase letter, one lowercase letter, and be at least 6 characters long'
      });
    }

    const { usersCollection } = getCollections();

    // check if user already exists
    const existingUser = await usersCollection.findOne({
      email: email.toLowerCase().trim()
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // create user data
    const newUser = createUserObject({
      name,
      email,
      password: hashedPassword,
      photoURL,
      phone,
      address,
      role
    });

    const result = await usersCollection.insertOne(newUser);

    // generate token
    const token = generateToken({
      id: result.insertedId,
      email: newUser.email,
      role: newUser.role
    });

    const successMessage = newUser.ownerStatus === 'Pending'
      ? 'Account registered! Your Equipment Owner application has been submitted to Admin for review.'
      : 'User registered successfully';

    res.cookie('token', token, cookieOptions).status(201).json({
      success: true,
      message: successMessage,
      token,
      user: {
        id: result.insertedId,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        requestedRole: newUser.requestedRole,
        ownerStatus: newUser.ownerStatus,
        photoURL: newUser.photoURL
      }
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration'
    });
  }
};

// login user with email and password
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const { usersCollection } = getCollections();

    // find user
    const user = await usersCollection.findOne({
      email: email.toLowerCase().trim()
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // compare password
    const isPasswordMatch = await bcrypt.compare(password, user.password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // generate token
    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role
    });

    res.cookie('token', token, cookieOptions).status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        requestedRole: user.requestedRole || (user.role === 'Owner' ? 'Owner' : 'Customer'),
        ownerStatus: user.ownerStatus || (user.role === 'Owner' ? 'Approved' : 'None'),
        photoURL: user.photoURL || ''
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
};

// google social login
const socialLogin = async (req, res) => {
  try {
    const { name, email, photoURL } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required for social login'
      });
    }

    const { usersCollection } = getCollections();
    const formattedEmail = email.toLowerCase().trim();

    let user = await usersCollection.findOne({ email: formattedEmail });

    // if user does not exist, create new user with default role Customer
    if (!user) {
      const newUser = createUserObject({
        name: name || 'User',
        email: formattedEmail,
        photoURL: photoURL || '',
        role: 'Customer'
      });

      const result = await usersCollection.insertOne(newUser);
      user = { ...newUser, _id: result.insertedId };
    }

    // generate token
    const token = generateToken({
      id: user._id,
      email: user.email,
      role: user.role
    });

    res.cookie('token', token, cookieOptions).status(200).json({
      success: true,
      message: 'Social login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        requestedRole: user.requestedRole || (user.role === 'Owner' ? 'Owner' : 'Customer'),
        ownerStatus: user.ownerStatus || (user.role === 'Owner' ? 'Approved' : 'None'),
        photoURL: user.photoURL || ''
      }
    });
  } catch (error) {
    console.error('Social login error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error during social login'
    });
  }
};

// logout user
const logoutUser = async (req, res) => {
  try {
    res.clearCookie('token', cookieOptions).status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to logout'
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  socialLogin,
  logoutUser
};
