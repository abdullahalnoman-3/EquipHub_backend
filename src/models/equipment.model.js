const { ObjectId } = require('mongodb');

// valid equipment categories
const VALID_CATEGORIES = [
  'Construction Equipment',
  'Photography Equipment',
  'Vehicles & Transportation',
  'Agriculture Equipment',
  'Electronics',
  'Event Equipment'
];

// valid rental types
const VALID_RENTAL_TYPES = ['Daily', 'Weekly', 'Monthly'];

// valid equipment status
const VALID_STATUS = ['Pending', 'Approved', 'Rejected'];

// validate equipment input data
const validateEquipment = (data) => {
  const { name, description, category, rentalPrice, rentalType, availableQuantity, image, location } = data;

  if (!name || !description || !category || !rentalPrice || !availableQuantity || !image || !location) {
    return {
      isValid: false,
      message: 'Name, description, category, rentalPrice, availableQuantity, image, and location are required'
    };
  }

  if (Number(rentalPrice) <= 0) {
    return {
      isValid: false,
      message: 'Rental price must be a positive number'
    };
  }

  if (Number(availableQuantity) <= 0) {
    return {
      isValid: false,
      message: 'Available quantity must be at least 1'
    };
  }

  if (rentalType && !VALID_RENTAL_TYPES.includes(rentalType)) {
    return {
      isValid: false,
      message: `Rental type must be one of: ${VALID_RENTAL_TYPES.join(', ')}`
    };
  }

  return { isValid: true };
};

// create formatted equipment object for database
const createEquipmentObject = (data, owner) => {
  return {
    name: data.name.trim(),
    description: data.description.trim(),
    category: data.category.trim(),
    rentalPrice: Number(data.rentalPrice),
    rentalType: data.rentalType || 'Daily',
    availableQuantity: Number(data.availableQuantity),
    condition: data.condition ? data.condition.trim() : 'Good',
    brand: data.brand ? data.brand.trim() : '',
    model: data.model ? data.model.trim() : '',
    image: data.image.trim(),
    terms: data.terms ? data.terms.trim() : 'Standard rental terms apply.',
    status: owner.role === 'Admin' ? 'Approved' : 'Pending', // Admins are automatically pre-approved
    owner: {
      id: new ObjectId(owner._id),
      name: owner.name,
      email: owner.email
    },
    location: data.location.trim(),
    averageRating: 0,
    reviewCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

module.exports = {
  VALID_CATEGORIES,
  VALID_RENTAL_TYPES,
  VALID_STATUS,
  validateEquipment,
  createEquipmentObject
};
