const { ObjectId } = require('mongodb');

// create formatted review object
const createReviewObject = (data, user, equipment) => {
  return {
    bookingId: data.bookingId ? new ObjectId(data.bookingId) : null,
    equipmentId: new ObjectId(equipment._id),
    equipmentName: equipment.name,
    equipmentImage: equipment.image || '',
    customerId: new ObjectId(user._id),
    customerName: user.name,
    customerEmail: user.email,
    customerPhoto: user.photoURL || '',
    rating: Number(data.rating),
    comment: data.comment.trim(),
    status: 'Approved', // default approved or pending
    isActive: true, // active by default
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

// validate review input
const validateReview = (data) => {
  const { equipmentId, rating, comment } = data;

  if (!equipmentId || !rating || !comment) {
    return {
      isValid: false,
      message: 'Equipment ID, rating (1-5), and comment are required'
    };
  }

  const numRating = Number(rating);
  if (isNaN(numRating) || numRating < 1 || numRating > 5) {
    return {
      isValid: false,
      message: 'Rating must be a number between 1 and 5'
    };
  }

  if (comment.trim().length < 5) {
    return {
      isValid: false,
      message: 'Comment must be at least 5 characters long'
    };
  }

  return { isValid: true };
};

module.exports = {
  createReviewObject,
  validateReview
};
