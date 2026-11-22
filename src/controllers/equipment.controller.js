const { ObjectId } = require('mongodb');
const { getCollections } = require('../config/db');
const { validateEquipment, createEquipmentObject } = require('../models/equipment.model');

// get all public approved equipment with search, filter, and sort (Challenge 1)
const getAllPublicEquipment = async (req, res) => {
  try {
    const {
      search,
      category,
      rentalType,
      minPrice,
      maxPrice,
      available,
      sortBy,
      page,
      limit
    } = req.query;

    const { equipmentCollection } = getCollections();

    // base query: only approved equipment
    const query = { status: 'Approved' };

    // search by name or location
    if (search && search.trim()) {
      query.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { location: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    // category filter
    if (category && category !== 'All' && category !== '') {
      query.category = category;
    }

    // rental type filter (Daily, Weekly, Monthly)
    if (rentalType && rentalType !== 'All' && rentalType !== '') {
      query.rentalType = rentalType;
    }

    // availability filter
    if (available === 'true') {
      query.availableQuantity = { $gt: 0 };
    }

    // price range filter
    if (minPrice || maxPrice) {
      query.rentalPrice = {};
      if (minPrice) query.rentalPrice.$gte = Number(minPrice);
      if (maxPrice) query.rentalPrice.$lte = Number(maxPrice);
    }

    // sorting options
    let sortOptions = { createdAt: -1 }; // default recently added
    if (sortBy === 'price_asc') {
      sortOptions = { rentalPrice: 1 };
    } else if (sortBy === 'price_desc') {
      sortOptions = { rentalPrice: -1 };
    } else if (sortBy === 'recent') {
      sortOptions = { createdAt: -1 };
    }

    // pagination and limits (e.g. limit=6 for home page)
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 12;
    const skip = (pageNum - 1) * limitNum;

    const totalCount = await equipmentCollection.countDocuments(query);
    const equipment = await equipmentCollection
      .find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .toArray();

    const { reviewsCollection } = getCollections();

    // Dynamically calculate product-specific review stats for every item
    const enrichedEquipment = await Promise.all(
      equipment.map(async (item) => {
        const reviewStats = await reviewsCollection
          .aggregate([
            {
              $match: {
                equipmentId: new ObjectId(item._id),
                status: 'Approved',
                isActive: true
              }
            },
            {
              $group: {
                _id: null,
                avgRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 }
              }
            }
          ])
          .toArray();

        const hasStats = reviewStats && reviewStats.length > 0;
        const rating = hasStats
          ? Math.round(reviewStats[0].avgRating * 10) / 10
          : 0;
        const total = hasStats
          ? reviewStats[0].totalReviews
          : 0;

        return {
          ...item,
          averageRating: rating,
          rating,
          reviewCount: total,
          totalReviews: total
        };
      })
    );

    res.status(200).json({
      success: true,
      totalCount,
      currentPage: pageNum,
      totalPages: Math.ceil(totalCount / limitNum),
      data: enrichedEquipment
    });
  } catch (error) {
    console.error('getAllPublicEquipment error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch equipment list'
    });
  }
};

// get single equipment details by ID
const getEquipmentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid equipment ID format'
      });
    }

    const { equipmentCollection, reviewsCollection } = getCollections();
    const equipment = await equipmentCollection.findOne({ _id: new ObjectId(id) });

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }

    // Aggregate real-time product reviews
    const reviewStats = await reviewsCollection
      .aggregate([
        {
          $match: {
            equipmentId: new ObjectId(id),
            status: 'Approved',
            isActive: true
          }
        },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 }
          }
        }
      ])
      .toArray();

    const hasStats = reviewStats && reviewStats.length > 0;
    const realRating = hasStats
      ? Math.round(reviewStats[0].avgRating * 10) / 10
      : 0;
    const realTotal = hasStats
      ? reviewStats[0].totalReviews
      : 0;

    const enrichedEquipment = {
      ...equipment,
      averageRating: realRating,
      rating: realRating,
      reviewCount: realTotal,
      totalReviews: realTotal
    };

    res.status(200).json({
      success: true,
      data: enrichedEquipment
    });
  } catch (error) {
    console.error('getEquipmentById error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch equipment details'
    });
  }
};

// create new equipment (Owner only)
const createEquipment = async (req, res) => {
  try {
    const validation = validateEquipment(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    const { equipmentCollection } = getCollections();
    const newEquipment = createEquipmentObject(req.body, req.user);

    const result = await equipmentCollection.insertOne(newEquipment);

    res.status(201).json({
      success: true,
      message: 'Equipment added successfully. Waiting for admin approval.',
      data: {
        equipmentId: result.insertedId,
        name: newEquipment.name,
        status: newEquipment.status
      }
    });
  } catch (error) {
    console.error('createEquipment error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to add equipment'
    });
  }
};

// get all equipment added by the logged-in owner
const getMyEquipment = async (req, res) => {
  try {
    const { equipmentCollection } = getCollections();
    const equipmentList = await equipmentCollection
      .find({ 'owner.email': req.user.email })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      data: equipmentList
    });
  } catch (error) {
    console.error('getMyEquipment error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch owner equipment'
    });
  }
};

// update equipment (Owner only with ownership check)
const updateEquipment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid equipment ID format'
      });
    }

    const { equipmentCollection } = getCollections();
    const equipment = await equipmentCollection.findOne({ _id: new ObjectId(id) });

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }

    // verify ownership (Admins have full permission over equipment)
    if (equipment.owner.email !== req.user.email && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own equipment'
      });
    }

    // prepare update fields
    const allowedFields = [
      'name', 'description', 'category', 'rentalPrice',
      'rentalType', 'availableQuantity', 'condition',
      'brand', 'model', 'image', 'terms', 'location'
    ];

    const updateFields = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === 'rentalPrice' || field === 'availableQuantity') {
          updateFields[field] = Number(req.body[field]);
        } else {
          updateFields[field] = req.body[field];
        }
      }
    }
    updateFields.updatedAt = new Date();

    await equipmentCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    res.status(200).json({
      success: true,
      message: 'Equipment updated successfully'
    });
  } catch (error) {
    console.error('updateEquipment error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update equipment'
    });
  }
};

// delete equipment (Owner only with ownership check)
const deleteEquipment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid equipment ID format'
      });
    }

    const { equipmentCollection } = getCollections();
    const equipment = await equipmentCollection.findOne({ _id: new ObjectId(id) });

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }

    // verify ownership (Admins have full permission over equipment)
    if (equipment.owner.email !== req.user.email && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own equipment'
      });
    }

    // Check if equipment has any associated rental orders/bookings
    const { bookingsCollection } = getCollections();
    const existingOrdersCount = await bookingsCollection.countDocuments({
      equipmentId: new ObjectId(id)
    });

    if (existingOrdersCount > 0) {
      return res.status(400).json({
        success: false,
        hasOrders: true,
        orderCount: existingOrdersCount,
        message: `Cannot delete equipment. There are ${existingOrdersCount} rental order(s) associated with this equipment. Please delete those rental orders first.`
      });
    }

    await equipmentCollection.deleteOne({ _id: new ObjectId(id) });

    res.status(200).json({
      success: true,
      message: 'Equipment deleted successfully'
    });
  } catch (error) {
    console.error('deleteEquipment error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete equipment'
    });
  }
};

module.exports = {
  getAllPublicEquipment,
  getEquipmentById,
  createEquipment,
  getMyEquipment,
  updateEquipment,
  deleteEquipment
};
