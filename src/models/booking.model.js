const { ObjectId } = require('mongodb');

// format booking data for database
const createBookingObject = (bookingData, user, equipment) => {
  return {
    customerInfo: {
      id: new ObjectId(user._id),
      name: user.name,
      email: user.email,
      phone: bookingData.contactNumber || user.phone || ''
    },
    equipmentId: new ObjectId(equipment._id),
    equipmentName: equipment.name,
    equipmentImage: equipment.image || '',
    equipmentCategory: equipment.category || '',
    ownerId: new ObjectId(equipment.owner?.id),
    ownerName: equipment.owner?.name || '',
    ownerEmail: equipment.owner?.email || '',
    rentalStartDate: new Date(bookingData.startDate),
    rentalEndDate: new Date(bookingData.endDate),
    bookingDate: new Date(),
    quantity: Number(bookingData.quantity),
    totalAmount: Number(bookingData.totalAmount),
    paymentStatus: 'Paid', // default paid via stripe
    bookingStatus: 'Pending', // pending, approved, active, completed, rejected, cancelled
    transactionId: bookingData.transactionId || '',
    deliveryAddress: bookingData.deliveryAddress || '',
    contactNumber: bookingData.contactNumber || '',
    notes: bookingData.notes || '',
    createdAt: new Date(),
    updatedAt: new Date()
  };
};

// format payment record for payments collection
const createPaymentObject = (bookingId, transactionId, amount, customerEmail) => {
  return {
    bookingId: new ObjectId(bookingId),
    transactionId: transactionId || '',
    amount: Number(amount),
    customerEmail,
    paymentDate: new Date(),
    paymentMethod: 'Stripe',
    status: 'Completed'
  };
};

module.exports = {
  createBookingObject,
  createPaymentObject
};
