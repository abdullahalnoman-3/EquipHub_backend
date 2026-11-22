const { ObjectId } = require('mongodb');
const { getCollections } = require('../config/db');
const { createReviewObject, validateReview } = require('../models/review.model');

// helper function to update equipment average rating
const updateEquipmentRating = async (equipmentId) => {
  try {
    const { reviewsCollection, equipmentCollection } = getCollections();
    const stats = await reviewsCollection.aggregate([
      {
        $match: {
          equipmentId: new ObjectId(equipmentId),
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
    ]).toArray();

    const averageRating = stats[0]?.avgRating ? Math.round(stats[0].avgRating * 10) / 10 : 0;
    const reviewCount = stats[0]?.totalReviews || 0;

    await equipmentCollection.updateOne(
      { _id: new ObjectId(equipmentId) },
      { $set: { averageRating, reviewCount } }
    );
  } catch (error) {
    console.error('updateEquipmentRating error:', error.message);
  }
};

// create a new review (Customer only)
const createReview = async (req, res) => {
  try {
    const validation = validateReview(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    const { equipmentId, rating, comment, bookingId } = req.body;

    if (!ObjectId.isValid(equipmentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid equipment ID format'
      });
    }

    const { reviewsCollection, equipmentCollection, bookingsCollection } = getCollections();

    // verify equipment exists
    const equipment = await equipmentCollection.findOne({ _id: new ObjectId(equipmentId) });
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }

    // verify user has rented this equipment (Admins have full testing and review permissions)
    if (req.user?.role !== 'Admin') {
      const hasBooked = await bookingsCollection.findOne({
        'customerInfo.email': req.user.email,
        equipmentId: new ObjectId(equipmentId)
      });

      if (!hasBooked) {
        return res.status(403).json({
          success: false,
          message: 'You can only review equipment you have previously rented'
        });
      }
    }

    // prevent duplicate reviews
    const existingReview = await reviewsCollection.findOne({
      customerEmail: req.user.email,
      equipmentId: new ObjectId(equipmentId)
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review for this equipment'
      });
    }

    const newReview = createReviewObject({ equipmentId, rating, comment, bookingId }, req.user, equipment);
    const result = await reviewsCollection.insertOne(newReview);

    // update equipment average rating
    await updateEquipmentRating(equipmentId);

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      reviewId: result.insertedId
    });
  } catch (error) {
    console.error('createReview error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to submit review'
    });
  }
};

// get approved and active reviews for a specific equipment (Public)
const getEquipmentReviews = async (req, res) => {
  try {
    const { equipmentId } = req.params;

    if (!ObjectId.isValid(equipmentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid equipment ID format'
      });
    }

    const { reviewsCollection } = getCollections();
    const reviews = await reviewsCollection
      .find({
        equipmentId: new ObjectId(equipmentId),
        status: 'Approved',
        isActive: true
      })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      totalCount: reviews.length,
      data: reviews
    });
  } catch (error) {
    console.error('getEquipmentReviews error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch equipment reviews'
    });
  }
};

// get featured reviews for Home page section (Public)
const getFeaturedReviews = async (req, res) => {
  try {
    const { reviewsCollection } = getCollections();
    const reviews = await reviewsCollection
      .find({
        status: 'Approved',
        isActive: true,
        rating: { $gte: 4 }
      })
      .sort({ rating: -1, createdAt: -1 })
      .limit(6)
      .toArray();

    res.status(200).json({
      success: true,
      totalCount: reviews.length,
      data: reviews
    });
  } catch (error) {
    console.error('getFeaturedReviews error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch featured reviews'
    });
  }
};

// admin get all reviews (Admin only)
const getAllReviewsAdmin = async (req, res) => {
  try {
    const { status, isActive } = req.query;
    const { reviewsCollection } = getCollections();

    const query = {};
    if (status && status !== 'All') {
      query.status = status;
    }
    if (isActive !== undefined && isActive !== '') {
      query.isActive = isActive === 'true';
    }

    const reviews = await reviewsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      totalCount: reviews.length,
      data: reviews
    });
  } catch (error) {
    console.error('getAllReviewsAdmin error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin reviews'
    });
  }
};

// admin update review status / active state (Admin only)
const updateReviewStatusAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, isActive } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review ID format'
      });
    }

    const { reviewsCollection } = getCollections();
    const review = await reviewsCollection.findOne({ _id: new ObjectId(id) });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    const updateFields = { updatedAt: new Date() };
    if (status !== undefined) {
      const allowed = ['Pending', 'Approved', 'Rejected'];
      if (!allowed.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Must be Pending, Approved, or Rejected'
        });
      }
      updateFields.status = status;
    }

    if (isActive !== undefined) {
      updateFields.isActive = Boolean(isActive);
    }

    await reviewsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    // recalculate equipment average rating
    await updateEquipmentRating(review.equipmentId);

    res.status(200).json({
      success: true,
      message: 'Review moderation updated successfully'
    });
  } catch (error) {
    console.error('updateReviewStatusAdmin error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update review status'
    });
  }
};

module.exports = {
  createReview,
  getEquipmentReviews,
  getFeaturedReviews,
  getAllReviewsAdmin,
  updateReviewStatusAdmin
};
