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

// get all rental bookings for logged-in customer (Customer Dashboard)
const getMyRentals = async (req, res) => {
  try {
    const { bookingsCollection } = getCollections();
    const rentals = await bookingsCollection
      .find({ 'customerInfo.email': req.user.email })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      totalCount: rentals.length,
      data: rentals
    });
  } catch (error) {
    console.error('getMyRentals error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer rentals'
    });
  }
};

// get all rental bookings for owner's equipment (Owner Dashboard)
const getOwnerRentals = async (req, res) => {
  try {
    const { bookingsCollection } = getCollections();
    const ownerRentals = await bookingsCollection
      .find({ ownerEmail: req.user.email })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      totalCount: ownerRentals.length,
      data: ownerRentals
    });
  } catch (error) {
    console.error('getOwnerRentals error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch owner rentals'
    });
  }
};

// update booking status (Owner or Admin)
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = ['Active', 'Completed', 'Cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be Active, Completed, or Cancelled'
      });
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format'
      });
    }

    const { bookingsCollection, equipmentCollection } = getCollections();
    const booking = await bookingsCollection.findOne({ _id: new ObjectId(id) });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // verify permission: Admin or Owner of this equipment
    const isOwner = booking.ownerEmail === req.user.email;
    const isAdmin = req.user.role === 'Admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this booking'
      });
    }

    // if cancelled, restore available equipment inventory
    if (status === 'Cancelled' && booking.bookingStatus !== 'Cancelled') {
      await equipmentCollection.updateOne(
        { _id: new ObjectId(booking.equipmentId) },
        { $inc: { availableQuantity: Number(booking.quantity) } }
      );
    }

    await bookingsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { bookingStatus: status, updatedAt: new Date() } }
    );

    res.status(200).json({
      success: true,
      message: `Booking status updated to ${status} successfully`
    });
  } catch (error) {
    console.error('updateBookingStatus error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status'
    });
  }
};

module.exports = {
  createBooking,
  getMyRentals,
  getOwnerRentals,
  updateBookingStatus
};
