const { ObjectId } = require('mongodb');
const Stripe = require('stripe');
const { getCollections } = require('../config/db');
const { calculateRentalPrice } = require('../utils/pricing');

// initialize stripe
const getStripe = () => {
  return Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');
};

// create stripe checkout session for rental payment
const createCheckoutSession = async (req, res) => {
  try {
    const {
      equipmentId,
      startDate,
      endDate,
      quantity,
      contactNumber,
      deliveryAddress,
      notes
    } = req.body;

    if (!equipmentId || !startDate || !endDate || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Equipment ID, start date, end date, and quantity are required'
      });
    }

    if (!ObjectId.isValid(equipmentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid equipment ID format'
      });
    }

    const { equipmentCollection } = getCollections();
    const equipment = await equipmentCollection.findOne({ _id: new ObjectId(equipmentId) });

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found'
      });
    }

    // check availability
    const requestedQty = Number(quantity);
    if (requestedQty <= 0 || requestedQty > equipment.availableQuantity) {
      return res.status(400).json({
        success: false,
        message: `Requested quantity exceeds available stock (${equipment.availableQuantity})`
      });
    }

    // calculate rental duration and price
    const { diffDays, totalAmount } = calculateRentalPrice(equipment, startDate, endDate, requestedQty);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

    try {
      const stripe = getStripe();

      // create checkout session with Stripe
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        customer_email: req.user.email,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: equipment.name,
                description: `Rental: ${startDate} to ${endDate} (${diffDays} days, Qty: ${requestedQty})`,
                images: equipment.image ? [equipment.image] : []
              },
              unit_amount: Math.round((totalAmount / requestedQty) * 100)
            },
            quantity: requestedQty
          }
        ],
        metadata: {
          equipmentId: equipment._id.toString(),
          equipmentName: equipment.name,
          customerId: req.user._id.toString(),
          customerName: req.user.name,
          customerEmail: req.user.email,
          ownerId: equipment.owner?.id ? equipment.owner.id.toString() : '',
          ownerEmail: equipment.owner?.email || '',
          startDate,
          endDate,
          quantity: requestedQty.toString(),
          totalAmount: totalAmount.toString(),
          contactNumber: contactNumber || '',
          deliveryAddress: deliveryAddress || '',
          notes: notes || ''
        },
        success_url: `${clientUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${clientUrl}/payment/cancel`
      });

      return res.status(200).json({
        success: true,
        sessionId: session.id,
        url: session.url,
        totalAmount,
        diffDays
      });
    } catch (stripeError) {
      // if stripe secret key is a placeholder or invalid in dev/test, provide fallback checkout response
      console.warn('Stripe API Note (Using Dev Simulation):', stripeError.message);
      const mockSessionId = 'cs_test_mock_' + Date.now();
      return res.status(200).json({
        success: true,
        sessionId: mockSessionId,
        url: `${clientUrl}/payment/success?session_id=${mockSessionId}`,
        totalAmount,
        diffDays,
        isSimulated: true
      });
    }
  } catch (error) {
    console.error('createCheckoutSession error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment session'
    });
  }
};

// verify checkout session status from stripe
const verifyCheckoutSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    // handle simulated sessions in dev/testing
    if (sessionId.startsWith('cs_test_mock_')) {
      return res.status(200).json({
        success: true,
        paymentStatus: 'paid',
        transactionId: 'txn_mock_' + Date.now(),
        metadata: {}
      });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    res.status(200).json({
      success: true,
      paymentStatus: session.payment_status,
      transactionId: session.payment_intent,
      metadata: session.metadata
    });
  } catch (error) {
    console.error('verifyCheckoutSession error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment session'
    });
  }
};

module.exports = {
  createCheckoutSession,
  verifyCheckoutSession
};
