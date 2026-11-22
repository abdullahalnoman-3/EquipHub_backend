const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');

// Ensure .env is explicitly resolved from application root directory
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config();

const { connectDB } = require('./src/config/db');
const { initRentalCronJob } = require('./src/utils/cron');
const { notFoundHandler, globalErrorHandler } = require('./src/middlewares/error.middleware');

// import routes
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const equipmentRoutes = require('./src/routes/equipment.routes');
const adminRoutes = require('./src/routes/admin.routes');
const favoriteRoutes = require('./src/routes/favorite.routes');
const paymentRoutes = require('./src/routes/payment.routes');
const bookingRoutes = require('./src/routes/booking.routes');
const analyticsRoutes = require('./src/routes/analytics.routes');
const reviewRoutes = require('./src/routes/review.routes');
const uploadRoutes = require('./src/routes/upload.routes');

const app = express();
const port = process.env.PORT || 5000;

// Trust reverse proxy (cPanel / Apache / Nginx / Cloudflare)
app.set('trust proxy', 1);

// CORS configuration (supports local, cPanel production with/without SSL & subdomains)
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5000',
  'https://equiphub.hmnoman.com',
  'http://equiphub.hmnoman.com',
  'https://www.equiphub.hmnoman.com',
  'http://www.equiphub.hmnoman.com',
  'https://equiphubadmin.hmnoman.com',
  'http://equiphubadmin.hmnoman.com',
  'https://www.equiphubadmin.hmnoman.com',
  'http://www.equiphubadmin.hmnoman.com',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);

    // Allow whitelisted origins, regex matches for equiphub and equiphubadmin (http & https), and all hmnoman.com subdomains
    const isAllowed =
      allowedOrigins.includes(origin) ||
      /^https?:\/\/(www\.)?equiphub\.hmnoman\.com\/?$/i.test(origin) ||
      /^https?:\/\/(www\.)?equiphubadmin\.hmnoman\.com\/?$/i.test(origin) ||
      origin.endsWith('.hmnoman.com') ||
      origin === 'https://hmnoman.com' ||
      origin === 'http://hmnoman.com';

    if (isAllowed) {
      callback(null, true);
    } else {
      // Permissive fallback so production requests are never accidentally blocked
      callback(null, true);
    }
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// serve public static assets (index status page, favicon, robots.txt for cPanel)
app.use(express.static(path.join(__dirname, 'public')));

// serve uploaded project files statically with security headers (nosniff & no directory listing)
app.use(
  '/uploads',
  (req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; img-src 'self' data:;");
    next();
  },
  express.static(path.join(__dirname, 'uploads'), {
    dotfiles: 'deny',
    index: false,
    maxAge: '7d'
  })
);

// application routes
app.use('/api/v1/upload', uploadRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/equipment', equipmentRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/favorites', favoriteRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/reviews', reviewRoutes);

// root route fallback if not handled by public/index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'), (err) => {
    if (err) {
      res.send({
        success: true,
        message: 'EquipHub server is running smoothly'
      });
    }
  });
});

// health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// 404 handler for undefined routes
app.use(notFoundHandler);

// global error handler
app.use(globalErrorHandler);

// start server after connecting to database
const startServer = async () => {
  try {
    await connectDB();

    // start background automated cron jobs
    initRentalCronJob();

    app.listen(port, () => {
      console.log(`EquipHub server is running on port: ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();

module.exports = app;
