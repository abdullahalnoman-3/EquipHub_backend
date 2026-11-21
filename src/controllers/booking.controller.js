const { ObjectId } = require('mongodb');
const { getCollections } = require('../config/db');
const { createBookingObject, createPaymentObject } = require('../models/booking.model');

// create new booking after successful stripe payment
const createBooking = async (req, res) => {
  try {
    const {
      equipmentId,
      startDate,
      endDate,
      quantity,
      totalAmount,
      transactionId,
      deliveryAddress,
      contactNumber,
      notes
    } = req.body;

    if (!equipmentId || !startDate || !endDate || !quantity || !totalAmount) {
      return res.status(400).json({
        success: false,
        message: 'Equipment ID, dates, quantity, and total amount are required'
      });
    }

    if (!ObjectId.isValid(equipmentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid equipment ID format'
      });
    }

    const { bookingsCollection, equipmentCollection, paymentsCollection } = getCollections();

    // find equipment
    const equipment = await equipmentCollection.findOne({ _id: new ObjectId(equipmentId) });
    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }

    const requestedQty = Number(quantity);

    // verify inventory
    if (requestedQty <= 0 || requestedQty > equipment.availableQuantity) {
      return res.status(400).json({
        success: false,
        message: `Only ${equipment.availableQuantity} items available in stock`
      });
    }

    // create booking record
    const bookingData = createBookingObject(
      {
        startDate,
        endDate,
        quantity: requestedQty,
        totalAmount,
        transactionId,
        deliveryAddress,
        contactNumber,
        notes
      },
      req.user,
      equipment
    );

    const bookingResult = await bookingsCollection.insertOne(bookingData);

    // save payment details in payments collection
    const paymentData = createPaymentObject(
      bookingResult.insertedId,
      transactionId,
      totalAmount,
      req.user.email
    );
    await paymentsCollection.insertOne(paymentData);

    // deduct available inventory
    await equipmentCollection.updateOne(
      { _id: new ObjectId(equipmentId) },
      { $inc: { availableQuantity: -requestedQty } }
    );

    res.status(201).json({
      success: true,
      message: 'Rental booking confirmed successfully',
      bookingId: bookingResult.insertedId,
      data: bookingData
    });
  } catch (error) {
    console.error('createBooking error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking record'
    });
  }
};

module.exports = {
  createBooking
};
