const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// middlewares
app.use(cors({
  origin: [process.env.CLIENT_URL || 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

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

// start the server
app.listen(port, () => {
  console.log(`EquipHub server is running on port: ${port}`);
});
