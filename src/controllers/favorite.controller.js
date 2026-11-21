const { ObjectId } = require('mongodb');
const { getCollections } = require('../config/db');
const { createFavoriteObject } = require('../models/favorite.model');

// add equipment to customer favorites
const addToFavorites = async (req, res) => {
  try {
    const { equipmentId } = req.body;

    if (!equipmentId || !ObjectId.isValid(equipmentId)) {
      return res.status(400).json({
        success: false,
        message: 'Valid equipment ID is required'
      });
    }

    const { favoritesCollection, equipmentCollection } = getCollections();

    // check if equipment exists
    const equipment = await equipmentCollection.findOne({ _id: new ObjectId(equipmentId) });
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }

    // check if already favorited
    const existing = await favoritesCollection.findOne({
      userEmail: req.user.email,
      equipmentId: new ObjectId(equipmentId)
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'This equipment is already in your favorites'
      });
    }

    const favoriteData = createFavoriteObject(equipmentId, req.user);
    const result = await favoritesCollection.insertOne(favoriteData);

    res.status(201).json({
      success: true,
      message: 'Equipment added to favorites',
      data: { favoriteId: result.insertedId }
    });
  } catch (error) {
    console.error('addToFavorites error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to add to favorites'
    });
  }
};

// get all favorites of logged-in customer with populated equipment details
const getMyFavorites = async (req, res) => {
  try {
    const { favoritesCollection } = getCollections();

    const favorites = await favoritesCollection.aggregate([
      { $match: { userEmail: req.user.email } },
      {
        $lookup: {
          from: 'equipment',
          localField: 'equipmentId',
          foreignField: '_id',
          as: 'equipment'
        }
      },
      { $unwind: '$equipment' },
      { $sort: { createdAt: -1 } }
    ]).toArray();

    res.status(200).json({
      success: true,
      totalCount: favorites.length,
      data: favorites
    });
  } catch (error) {
    console.error('getMyFavorites error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch favorites'
    });
  }
};

// check if a specific equipment is favorited by customer
const checkIsFavorite = async (req, res) => {
  try {
    const { equipmentId } = req.params;

    if (!ObjectId.isValid(equipmentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid equipment ID format'
      });
    }

    const { favoritesCollection } = getCollections();
    const existing = await favoritesCollection.findOne({
      userEmail: req.user.email,
      equipmentId: new ObjectId(equipmentId)
    });

    res.status(200).json({
      success: true,
      isFavorite: !!existing
    });
  } catch (error) {
    console.error('checkIsFavorite error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to check favorite status'
    });
  }
};

// remove equipment from favorites
const removeFromFavorites = async (req, res) => {
  try {
    const { equipmentId } = req.params;

    if (!ObjectId.isValid(equipmentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid equipment ID format'
      });
    }

    const { favoritesCollection } = getCollections();
    const result = await favoritesCollection.deleteOne({
      userEmail: req.user.email,
      equipmentId: new ObjectId(equipmentId)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found in favorites'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Equipment removed from favorites successfully'
    });
  } catch (error) {
    console.error('removeFromFavorites error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to remove from favorites'
    });
  }
};

module.exports = {
  addToFavorites,
  getMyFavorites,
  checkIsFavorite,
  removeFromFavorites
};
