const nodemailer = require('nodemailer');
const { getCollections } = require('../config/db');

// helper to get SMTP transporter from database or .env
const getTransporter = async () => {
  try {
    const { settingsCollection } = getCollections();
    const smtpConfig = await settingsCollection.findOne({ key: 'smtp_settings' });

    const host = smtpConfig?.host || process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = smtpConfig?.port || process.env.SMTP_PORT || 587;
    const user = smtpConfig?.user || process.env.SMTP_USER;
    const pass = smtpConfig?.pass || process.env.SMTP_PASS;

    if (!user || !pass) {
      return null;
    }

    return {
      transporter: nodemailer.createTransport({
        host,
        port: Number(port),
        secure: Number(port) === 465,
        auth: { user, pass }
      }),
      fromEmail: smtpConfig?.fromEmail || process.env.SMTP_FROM || user
    };
  } catch (error) {
    console.error('getTransporter error:', error.message);
    return null;
  }
};

// generic email sender
const sendEmail = async ({ to, subject, html }) => {
  try {
    const mailer = await getTransporter();

    if (!mailer) {
      console.log(`[Email Simulation]: To: ${to} | Subject: "${subject}" (SMTP credentials not configured yet)`);
      return { success: true, simulated: true };
    }

    const info = await mailer.transporter.sendMail({
      from: `"EquipHub" <${mailer.fromEmail}>`,
      to,
      subject,
      html
    });

    console.log(`[Email Sent]: Message ID: ${info.messageId} to ${to}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('[Email Sending Error]:', error.message);
    return { success: false, error: error.message };
  }
};

// 1. send booking confirmation to customer with digital receipt
const sendBookingConfirmationToCustomer = async (booking) => {
  const subject = `Booking Confirmed: ${booking.equipmentName} (#${booking.transactionId?.slice(-6) || 'N/A'})`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; color: #1e293b;">
      <h2 style="color: #2563eb; margin-top: 0;">EquipHub Rental Confirmation</h2>
      <p>Hello <strong>${booking.customerInfo.name}</strong>,</p>
      <p>Your rental booking has been successfully confirmed and paid for!</p>
      
      <div style="background-color: #f8fafc; border-radius: 6px; padding: 16px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #0f172a;">Rental Summary</h3>
        <p><strong>Equipment:</strong> ${booking.equipmentName}</p>
        <p><strong>Rental Duration:</strong> ${new Date(booking.rentalStartDate).toLocaleDateString()} to ${new Date(booking.rentalEndDate).toLocaleDateString()}</p>
        <p><strong>Quantity:</strong> ${booking.quantity}</p>
        <p><strong>Total Paid:</strong> $${booking.totalAmount}</p>
        <p><strong>Transaction ID:</strong> ${booking.transactionId || 'Completed via Stripe'}</p>
        <p><strong>Delivery Address:</strong> ${booking.deliveryAddress || 'Pickup / As arranged'}</p>
      </div>

      <p style="color: #64748b; font-size: 14px;">Thank you for renting with EquipHub! Contact us or your equipment owner if you have questions.</p>
    </div>
  `;

  return sendEmail({ to: booking.customerInfo.email, subject, html });
};

// 2. send rental notification to equipment owner
const sendRentalAlertToOwner = async (booking) => {
  const subject = `New Equipment Rental Order: ${booking.equipmentName}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; color: #1e293b;">
      <h2 style="color: #16a34a; margin-top: 0;">New Rental Order!</h2>
      <p>Hello <strong>${booking.ownerName}</strong>,</p>
      <p>Great news! A customer has rented your equipment on EquipHub.</p>
      
      <div style="background-color: #f8fafc; border-radius: 6px; padding: 16px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #0f172a;">Order Details</h3>
        <p><strong>Equipment:</strong> ${booking.equipmentName}</p>
        <p><strong>Rented By:</strong> ${booking.customerInfo.name} (${booking.customerInfo.email})</p>
        <p><strong>Contact:</strong> ${booking.customerInfo.phone || 'N/A'}</p>
        <p><strong>Rental Dates:</strong> ${new Date(booking.rentalStartDate).toLocaleDateString()} to ${new Date(booking.rentalEndDate).toLocaleDateString()}</p>
        <p><strong>Quantity:</strong> ${booking.quantity}</p>
        <p><strong>Booking Amount:</strong> $${booking.totalAmount}</p>
      </div>

      <p style="color: #64748b; font-size: 14px;">You can view and manage this order in your Owner Dashboard.</p>
    </div>
  `;

  return sendEmail({ to: booking.ownerEmail, subject, html });
};

// 3. send equipment approval or rejection status to owner
const sendEquipmentStatusToOwner = async (equipment, status) => {
  const isApproved = status === 'Approved';
  const subject = `Equipment Listing Update: ${equipment.name} is ${status}`;
  const statusColor = isApproved ? '#16a34a' : '#dc2626';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; color: #1e293b;">
      <h2 style="color: ${statusColor}; margin-top: 0;">Equipment Listing ${status}</h2>
      <p>Hello <strong>${equipment.owner.name}</strong>,</p>
      <p>Your equipment listing <strong>${equipment.name}</strong> has been reviewed by the admin.</p>
      
      <div style="background-color: #f8fafc; border-radius: 6px; padding: 16px; margin: 20px 0;">
        <p><strong>Equipment Name:</strong> ${equipment.name}</p>
        <p><strong>Category:</strong> ${equipment.category}</p>
        <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${status}</span></p>
      </div>

      <p style="color: #64748b; font-size: 14px;">
        ${isApproved ? 'Your equipment is now live and visible to customers on the EquipHub marketplace!' : 'Unfortunately, your listing was rejected. You can update the details in your dashboard.'}
      </p>
    </div>
  `;

  return sendEmail({ to: equipment.owner.email, subject, html });
};

module.exports = {
  sendEmail,
  sendBookingConfirmationToCustomer,
  sendRentalAlertToOwner,
  sendEquipmentStatusToOwner
};
