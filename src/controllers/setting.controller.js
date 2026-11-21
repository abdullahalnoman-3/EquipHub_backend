const { getCollections } = require('../config/db');

// get current SMTP settings (Admin only)
const getSMTPSettings = async (req, res) => {
  try {
    const { settingsCollection } = getCollections();
    const config = await settingsCollection.findOne({ key: 'smtp_settings' });

    if (!config) {
      return res.status(200).json({
        success: true,
        data: {
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: process.env.SMTP_PORT || 587,
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS ? '********' : '',
          fromEmail: process.env.SMTP_FROM || '',
          isConfigured: !!process.env.SMTP_USER
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        host: config.host,
        port: config.port,
        user: config.user,
        pass: config.pass ? '********' : '',
        fromEmail: config.fromEmail,
        isConfigured: true,
        updatedAt: config.updatedAt
      }
    });
  } catch (error) {
    console.error('getSMTPSettings error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch SMTP settings'
    });
  }
};

// update SMTP settings from Admin Dashboard
const updateSMTPSettings = async (req, res) => {
  try {
    const { host, port, user, pass, fromEmail } = req.body;

    if (!host || !port || !user) {
      return res.status(400).json({
        success: false,
        message: 'Host, port, and user are required'
      });
    }

    const { settingsCollection } = getCollections();

    // prepare update fields
    const updateData = {
      key: 'smtp_settings',
      host: host.trim(),
      port: Number(port),
      user: user.trim(),
      fromEmail: fromEmail ? fromEmail.trim() : user.trim(),
      updatedAt: new Date()
    };

    // only update password if new password provided
    if (pass && pass.trim() !== '********') {
      updateData.pass = pass.trim();
    }

    await settingsCollection.updateOne(
      { key: 'smtp_settings' },
      { $set: updateData },
      { upsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'SMTP settings updated successfully'
    });
  } catch (error) {
    console.error('updateSMTPSettings error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to update SMTP settings'
    });
  }
};

module.exports = {
  getSMTPSettings,
  updateSMTPSettings
};
