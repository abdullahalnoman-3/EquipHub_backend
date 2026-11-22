// cPanel Phusion Passenger Startup Entry Point
// If cPanel Node.js selector asks for "Application startup file", you can use app.js or index.js
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
require('dotenv').config();

require('./index.js');
