const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const { connectDB } = require('./src/config/db');

// import routes
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');

const app = express();
const port = process.env.PORT || 5000;

// middlewares
app.use(cors({
  origin: [process.env.CLIENT_URL || 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// application routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);

// root route
app.get('/', (req, res) => {
  res.send({
    success: true,
    message: 'EquipHub server is running smoothly'
  });
});

// health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// start server after connecting to database
const startServer = async () => {
  try {
    await connectDB();
    app.listen(port, () => {
      console.log(`EquipHub server is running on port: ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();
