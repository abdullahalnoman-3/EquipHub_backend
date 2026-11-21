const bcrypt = require('bcryptjs');
const { getCollections } = require('../config/db');
const { createUserObject } = require('../models/user.model');

// register new user
const registerUser = async (req, res) => {
  try {
    const { name, email, password, photoURL, phone, address } = req.body;

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
      role: 'Customer'
    });

    const result = await usersCollection.insertOne(newUser);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        userId: result.insertedId,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
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

module.exports = {
  registerUser
};
