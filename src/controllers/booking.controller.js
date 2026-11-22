const { ObjectId } = require('mongodb');
const { getCollections } = require('../config/db');
const { createBookingObject, createPaymentObject } = require('../models/booking.model');
const {
  sendBookingConfirmationToCustomer,
  sendRentalAlertToOwner,
  sendRefundNotificationToCustomer
} = require('../services/email.service');

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

    // 1. Prevent duplicate bookings by transactionId (Idempotency)
    if (transactionId) {
      const existingByTxn = await bookingsCollection.findOne({ transactionId });
      if (existingByTxn) {
        return res.status(200).json({
          success: true,
          message: 'Booking already recorded',
          bookingId: existingByTxn._id,
          isDuplicate: true
        });
      }
    }

    // 2. Prevent rapid duplicate submissions (within 15 seconds for same customer & equipment)
    const recentDuplicate = await bookingsCollection.findOne({
      'customerInfo.email': req.user.email,
      equipmentId: new ObjectId(equipmentId),
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      createdAt: { $gte: new Date(Date.now() - 15 * 1000) }
    });
    if (recentDuplicate) {
      return res.status(200).json({
        success: true,
        message: 'Booking already recorded',
        bookingId: recentDuplicate._id,
        isDuplicate: true
      });
    }

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

    // trigger automated email notifications in background
    sendBookingConfirmationToCustomer(bookingData).catch(err => {
      console.log('Customer notification notice:', err.message);
    });
    sendRentalAlertToOwner(bookingData).catch(err => {
      console.log('Owner notification notice:', err.message);
    });

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

    const allowedStatuses = ['Pending', 'Approved', 'Active', 'Completed', 'Rejected', 'Cancelled'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be Pending, Approved, Active, Completed, Rejected, or Cancelled'
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

    // verify permission: Admin, Owner of this equipment, or the Customer who placed the booking
    const isOwner = booking.ownerEmail === req.user.email;
    const isAdmin = req.user.role === 'Admin';
    const isCustomer = booking.customerInfo?.email === req.user.email;

    if (!isOwner && !isAdmin && !isCustomer) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this booking'
      });
    }

    // Customer specific rule: Can cancel only their own reservation if Pending or Approved
    if (isCustomer && !isOwner && !isAdmin) {
      if (status !== 'Cancelled') {
        return res.status(403).json({
          success: false,
          message: 'Customers are only permitted to cancel their own reservation'
        });
      }
      const currentStatus = booking.bookingStatus?.toLowerCase();
      if (currentStatus !== 'pending' && currentStatus !== 'approved') {
        return res.status(400).json({
          success: false,
          message: `Cannot cancel rental with status "${booking.bookingStatus}". Only Pending and Approved rentals can be cancelled.`
        });
      }
    }

    // Business Rule: Active rentals cannot be cancelled or rejected
    if (booking.bookingStatus === 'Active' && (status === 'Cancelled' || status === 'Rejected')) {
      return res.status(400).json({
        success: false,
        message: 'Active rentals cannot be cancelled or rejected. The equipment is currently in use and can only be marked as Completed upon return.'
      });
    }

    const isCancelOrReject = status === 'Cancelled' || status === 'Rejected';
    const wasCancelOrReject = booking.bookingStatus === 'Cancelled' || booking.bookingStatus === 'Rejected';

    // if cancelling or rejecting, restore available equipment inventory
    if (isCancelOrReject && !wasCancelOrReject) {
      await equipmentCollection.updateOne(
        { _id: new ObjectId(booking.equipmentId) },
        { $inc: { availableQuantity: Number(booking.quantity) } }
      );
    } else if (!isCancelOrReject && wasCancelOrReject) {
      // if un-cancelling (e.g. approving an order), deduct inventory
      await equipmentCollection.updateOne(
        { _id: new ObjectId(booking.equipmentId) },
        { $inc: { availableQuantity: -Number(booking.quantity) } }
      );
    }

    const updateDoc = {
      bookingStatus: status,
      updatedAt: new Date()
    };

    // If cancelled or rejected, immediately initiate the Refund Process
    if (isCancelOrReject && !wasCancelOrReject) {
      updateDoc.paymentStatus = 'Refund Processing';
      updateDoc.refundDetails = {
        status: 'Processing',
        amount: Number(booking.totalAmount),
        initiatedBy: isCustomer ? 'Customer' : (isAdmin ? 'Admin' : 'Owner'),
        initiatedAt: new Date(),
        reason: isCustomer ? 'Customer cancelled reservation' : 'Reservation rejected or cancelled by owner/admin',
        estimatedProcessingTime: '3-5 business days'
      };

      const { paymentsCollection } = getCollections();
      if (paymentsCollection) {
        await paymentsCollection.updateOne(
          { bookingId: new ObjectId(id) },
          {
            $set: {
              status: 'Refund Processing',
              refundAmount: Number(booking.totalAmount),
              refundInitiatedAt: new Date()
            }
          }
        );
      }

      // Send refund email to customer in background
      sendRefundNotificationToCustomer(booking).catch(err => {
        console.log('Refund notification notice:', err.message);
      });
    }

    await bookingsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateDoc }
    );

    res.status(200).json({
      success: true,
      message: `Booking status updated to ${status} successfully. ${isCancelOrReject ? 'Payment has been sent to the Refund Process.' : ''}`
    });
  } catch (error) {
    console.error('updateBookingStatus error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status'
    });
  }
};

// delete booking record (Owner of equipment or Admin)
const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID format'
      });
    }

    const { bookingsCollection, equipmentCollection, paymentsCollection } = getCollections();
    const booking = await bookingsCollection.findOne({ _id: new ObjectId(id) });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Rental order not found'
      });
    }

    // verify permission: Admin or Owner of this equipment
    const isOwner = booking.ownerEmail === req.user.email;
    const isAdmin = req.user.role === 'Admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this rental order'
      });
    }

    // If order was holding inventory (not Cancelled or Rejected), restore inventory to equipment
    if (booking.bookingStatus !== 'Cancelled' && booking.bookingStatus !== 'Rejected') {
      await equipmentCollection.updateOne(
        { _id: new ObjectId(booking.equipmentId) },
        { $inc: { availableQuantity: Number(booking.quantity) } }
      );
    }

    // Delete the booking record
    await bookingsCollection.deleteOne({ _id: new ObjectId(id) });

    // Clean up associated payment records
    if (paymentsCollection) {
      await paymentsCollection.deleteMany({ bookingId: new ObjectId(id) });
    }

    res.status(200).json({
      success: true,
      message: 'Rental order deleted successfully'
    });
  } catch (error) {
    console.error('deleteBooking error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to delete rental order'
    });
  }
};

module.exports = {
  createBooking,
  getMyRentals,
  getOwnerRentals,
  updateBookingStatus,
  deleteBooking
};
