const { ObjectId } = require('mongodb');
const { getCollections } = require('../config/db');

// get current logged in user profile
const getMyProfile = async (req, res) => {
  try {
    const { usersCollection } = getCollections();
    const user = await usersCollection.findOne(
      { _id: new ObjectId(req.user._id) },
      { projection: { password: 0 } }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('getMyProfile error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile'
    });
  }
};

// update current logged in user profile
const updateMyProfile = async (req, res) => {
  try {
    const { name, phone, address, photoURL } = req.body;
    const { usersCollection } = getCollections();

    const updateData = {};
    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (address !== undefined) updateData.address = address;
    if (photoURL !== undefined) updateData.photoURL = photoURL;
    updateData.updatedAt = new Date();

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(req.user._id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('updateMyProfile error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

// get all users (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const { usersCollection } = getCollections();
    const users = await usersCollection
      .find({}, { projection: { password: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('getAllUsers error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
};

// update user role (Admin only)
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const allowedRoles = ['Customer', 'Owner', 'Admin'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be Customer, Owner, or Admin'
      });
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
    }

    const { usersCollection } = getCollections();
    const result = await usersCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { role, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `User role updated to ${role} successfully`
    });
  } catch (error) {
    console.error('updateUserRole error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update user role'
    });
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  getAllUsers,
  updateUserRole
};
