# 🛠️ EquipHub Backend API

EquipHub is a full-featured equipment rental platform connecting equipment owners with customers. This server provides secure RESTful APIs, role-based access control, Stripe payment processing, and automated background tasks.

---

## 🚀 Key Features

* **Authentication & Authorization**: Secure email/password authentication with bcrypt hashing, Google social login, and JWT-based session management.
* **Role-Based Access Control (RBAC)**: Custom middlewares protecting API routes for **Customer**, **Owner**, and **Admin**.
* **Equipment Management**: Owners can list, update, and manage equipment; Admins approve/reject listings; Customers browse and view details.
* **Dynamic Search & Filtering (Challenge 1)**: Server-side search by name/location, category filters, price range, availability, and sorting.
* **Favorites System**: Customers can save and manage favorite equipment with populated data.
* **Stripe Checkout (Payment Gateway)**: Dynamic rental duration and price calculation with secure checkout session generation.
* **Rental Bookings & Inventory**: Automated stock deduction upon booking and transaction recording in payments collection.
* **Dashboard Analytics (Challenge 3)**: High-performance MongoDB aggregation pipelines providing real-time metrics and monthly chart datasets for Admins and Owners.
* **Automated Cron Jobs**: Scheduled `node-cron` job running daily to automatically mark expired rentals as `Completed`.
* **Centralized Error Handling**: Structured 404 and global 500 error handling middlewares.

---

## 📦 NPM Packages Used

* `express`: Fast, unopinionated web framework for Node.js
* `mongodb`: Official MongoDB driver for database persistence
* `jsonwebtoken`: Secure JWT token creation and verification
* `bcryptjs`: Password hashing and security
* `cors`: Cross-Origin Resource Sharing handling
* `dotenv`: Environment variable management
* `cookie-parser`: Parsing HTTP cookies
* `stripe`: Stripe API SDK for processing rental payments
* `node-cron`: Task scheduler for automated background jobs
* `nodemon`: Development tool for automatic server reloads

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory based on `.env.example`:

```env
PORT=5000
NODE_ENV=development
DB_USER=your_db_username
DB_PASS=your_db_password
DB_NAME=equiphub_db
DB_URI=mongodb+srv://<username>:<password>@cluster0.2ssk8l9.mongodb.net/equiphub_db?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=http://localhost:3000
STRIPE_SECRET_KEY=your_stripe_secret_key
```

---

## 📡 API Endpoints Overview

### 🔐 Authentication (`/api/v1/auth`)
* `POST /api/v1/auth/register` - Register a new customer account
* `POST /api/v1/auth/login` - Login with email & password
* `POST /api/v1/auth/social-login` - Google social login integration
* `POST /api/v1/auth/logout` - Logout and clear session cookie

### 👤 User Profile & Management (`/api/v1/users`)
* `GET /api/v1/users/me` - Get logged-in user profile (Protected)
* `PATCH /api/v1/users/me` - Update profile info (Protected)
* `GET /api/v1/users` - Get all users (Admin only)
* `PATCH /api/v1/users/:id/role` - Update user role (Admin only)

### 🚜 Equipment Management (`/api/v1/equipment`)
* `GET /api/v1/equipment` - Public search, filter, and paginated equipment
* `GET /api/v1/equipment/:id` - Get single equipment details
* `POST /api/v1/equipment` - Add new equipment (Owner only)
* `GET /api/v1/equipment/my-equipment` - Get owner's equipment (Owner only)
* `PATCH /api/v1/equipment/:id` - Update equipment details (Owner only)
* `DELETE /api/v1/equipment/:id` - Delete equipment (Owner only)

### 🛡️ Admin Moderation (`/api/v1/admin`)
* `GET /api/v1/admin/equipment` - View all equipment (Admin only)
* `PATCH /api/v1/admin/equipment/:id/status` - Approve or reject equipment (Admin only)
* `DELETE /api/v1/admin/equipment/:id` - Remove equipment (Admin only)
* `GET /api/v1/admin/rentals` - View all platform rental orders (Admin only)

### ❤️ Favorites (`/api/v1/favorites`)
* `POST /api/v1/favorites` - Add item to customer favorites (Customer only)
* `GET /api/v1/favorites` - Get all customer favorites with populated details (Customer only)
* `GET /api/v1/favorites/check/:equipmentId` - Check favorite status (Customer only)
* `DELETE /api/v1/favorites/:equipmentId` - Remove from favorites (Customer only)

### 💳 Payments (`/api/v1/payments`)
* `POST /api/v1/payments/create-checkout-session` - Create Stripe checkout session
* `GET /api/v1/payments/verify-session/:sessionId` - Verify Stripe payment session

### 📋 Bookings & Rentals (`/api/v1/bookings`)
* `POST /api/v1/bookings` - Confirm booking after payment & deduct inventory
* `GET /api/v1/bookings/my-rentals` - Customer rental history (Customer only)
* `GET /api/v1/bookings/owner-rentals` - Owner equipment rental orders (Owner only)
* `PATCH /api/v1/bookings/:id/status` - Update rental status (Owner/Admin)

### 📊 Dashboard Analytics (`/api/v1/analytics`)
* `GET /api/v1/analytics/admin` - Overall platform metrics and monthly stats (Admin only)
* `GET /api/v1/analytics/owner` - Owner specific earnings and performance (Owner only)

---

## 🏃‍♂️ How to Run Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/abdullahalnoman-3/EquipHub_backend.git
   cd EquipHub_backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   Create `.env` file and add your credentials.

4. **Start the server:**
   ```bash
   npm run dev
   ```
