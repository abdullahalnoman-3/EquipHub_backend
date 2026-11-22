# 🛠️ EquipHub Backend API

> **High-Performance Equipment Rental Engine** built with **Node.js**, **Express**, **MongoDB Atlas**, **Stripe API**, **Nodemailer SMTP**, and **node-cron**.

---

## 🌐 Live Services & Production URLs

- **Production API Base:** `https://equiphubadmin.hmnoman.com/api/v1` (SSL / Non-SSL: `http://equiphubadmin.hmnoman.com/api/v1`)
- **Production Frontend Client:** `https://equiphub.hmnoman.com` (SSL / Non-SSL: `http://equiphub.hmnoman.com`)
- **Local Dev API:** `http://localhost:5000/api/v1`
- **GitHub Backend Repository:** [https://github.com/abdullahalnoman-3/EquipHub_backend.git](https://github.com/abdullahalnoman-3/EquipHub_backend.git)
- **GitHub Frontend Repository:** [https://github.com/abdullahalnoman-3/EquipHub_frontend.git](https://github.com/abdullahalnoman-3/EquipHub_frontend.git)

---

## 🚀 cPanel Deployment Instructions (Backend)

### Option A: Using cPanel "Setup Node.js App"
1. In cPanel, navigate to **Software** > **Setup Node.js App**.
2. Click **Create Application**:
   - **Node.js Version:** `20.x` or `22.x`
   - **Application Mode:** `Production`
   - **Application Root:** `equiphub_backend` (or the folder path where you upload backend files)
   - **Application URL:** `equiphubadmin.hmnoman.com`
   - **Application Startup File:** `app.js` (or `index.js`)
3. Upload backend source files (excluding `node_modules`).
4. In the cPanel Node.js App interface, click **Run NPM Install** (or install dependencies via SSH terminal).
5. In **Environment Variables** (or by creating a `.env` file in the application root), set:
   ```env
   NODE_ENV=production
   PORT=5000
   DB_URI=mongodb+srv://<username>:<password>@cluster0.2ssk8l9.mongodb.net/equiphub_db?retryWrites=true&w=majority
   JWT_SECRET=equiphub_production_secret_key_2026
   CLIENT_URL=https://equiphub.hmnoman.com
   STRIPE_SECRET_KEY=sk_test_51MockStripeSecretKeyForTestingEquipHub2026
   ```
6. Click **Restart Application**.
7. Visit `https://equiphubadmin.hmnoman.com/health` to verify server is live.

---

## 🚀 Architectural & Feature Highlights

### 1. Dual-Gate Rental Lifecycle & Strict Transitions
* **`Pending`**: Default status when a customer pays and creates a reservation. Awaits owner review.
* **`Approved`**: Owner accepts the reservation. At this stage, either party can still cancel if needed.
* **`Active`**: Equipment has been handed over / lease has started. **Strict Business Rule:** Active rentals cannot be cancelled or rejected—they must be marked as `Completed` upon return.
* **`Completed`**: Rental period concluded and equipment returned in good standing.
* **`Rejected` / `Cancelled`**: Automatically triggers inventory restoration and transfers payment to the **Refund Processing** pipeline.

### 2. Automated Refund Pipeline
* When a customer or owner cancels a `Pending` or `Approved` reservation:
  * The order status becomes `Cancelled`.
  * The payment status transitions to `Refund Processing`.
  * Dedicated `refundDetails` audit object is created in the database.
  * Payment records in `paymentsCollection` are synchronized.
  * Reserved equipment inventory stock (`availableQuantity`) is instantly returned to the catalog.
  * An automated email notification is dispatched to the customer informing them of the refund initiation (estimated 3–5 business days).

### 3. Equipment Deletion Integrity Guard
* To safeguard financial auditing and user transaction history, an equipment listing **cannot be deleted** if any active or historical rental orders exist for it.
* Users must first resolve or delete the associated rental orders before the machinery listing can be removed.
* Added `DELETE /api/v1/bookings/:id` allowing Owners and Admins to safely manage and delete resolved orders.

### 4. Admin Payment Gateway Settings (Dynamic Stripe Credentials)
* Stripe gateway credentials (`publishableKey`, `secretKey`, `webhookSecret`, `currency`, `escrowPercentage`) can be updated dynamically from the Admin dashboard without restarting the server.
* Built-in connection testing endpoint verifies Stripe API key validity with Stripe servers.

### 5. Product-Based Dynamic Reviews & Ratings
* Equipment rating computation is fully dynamic: average rating and total review counts are calculated in real time from approved customer reviews in `reviewsCollection`.
* Eliminates hardcoded ratings across the platform.

### 6. Booking Idempotency & Deduplication
* Guards against accidental double charges and duplicate submissions via transaction ID deduplication and rapid-click (15-second window) throttling.

### 7. Automated Daily Rental Status Synchronization
* Scheduled `node-cron` job runs daily at midnight to audit active rentals and flag past-due bookings.

---

## 📡 Complete RESTful API Reference

### 🔐 Authentication (`/api/v1/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Public | Register new customer/owner account |
| `POST` | `/api/v1/auth/login` | Public | Authenticate with email & password |
| `POST` | `/api/v1/auth/social-login` | Public | Google OAuth social login |
| `POST` | `/api/v1/auth/logout` | Public | Clear session cookie |

### 👤 User Management (`/api/v1/users`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/users/me` | Authenticated | Retrieve current user profile |
| `PATCH` | `/api/v1/users/me` | Authenticated | Update profile name, phone, address, photo |
| `GET` | `/api/v1/users` | Admin | Get all registered platform users |
| `PATCH` | `/api/v1/users/:id/role` | Admin | Upgrade or change user role (`Customer`, `Owner`, `Admin`) |

### 🚜 Equipment Management (`/api/v1/equipment`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/equipment` | Public | Search, category filter, price range, and sort |
| `GET` | `/api/v1/equipment/:id` | Public | Single equipment details with dynamic ratings |
| `POST` | `/api/v1/equipment` | Owner/Admin | Create new equipment listing |
| `GET` | `/api/v1/equipment/my-equipment` | Owner/Admin | Get all equipment owned by logged-in user |
| `PATCH` | `/api/v1/equipment/:id` | Owner/Admin | Edit rates, description, stock, condition |
| `DELETE` | `/api/v1/equipment/:id` | Owner/Admin | Delete equipment (Blocked if orders exist) |

### 🛡️ Admin Controls & Settings (`/api/v1/admin`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/equipment` | Admin | List all equipment across the platform |
| `PATCH` | `/api/v1/admin/equipment/:id/status`| Admin | Moderate listing (`Approved`, `Rejected`, `Pending`) |
| `DELETE` | `/api/v1/admin/equipment/:id` | Admin | Delete listing (Blocked if orders exist) |
| `GET` | `/api/v1/admin/rentals` | Admin | Master log of all platform rental orders |
| `GET` | `/api/v1/admin/payment-settings` | Admin | Retrieve dynamic Stripe gateway parameters |
| `PATCH` | `/api/v1/admin/payment-settings` | Admin | Save dynamic Stripe credentials & escrow rate |
| `POST` | `/api/v1/admin/payment-settings/test`| Admin | Test Stripe API connectivity with test probe |
| `GET` | `/api/v1/admin/smtp` | Admin | Retrieve SMTP settings |
| `PATCH` | `/api/v1/admin/smtp` | Admin | Save outbound mail configuration |

### 📋 Bookings & Rentals (`/api/v1/bookings`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/bookings` | Customer | Create booking, verify payment, deduct stock |
| `GET` | `/api/v1/bookings/my-rentals` | Customer | Customer's rental reservations |
| `GET` | `/api/v1/bookings/owner-rentals` | Owner/Admin | Incoming customer orders for owner's machinery |
| `PATCH` | `/api/v1/bookings/:id/status` | Authorized | Update status (`Approved`, `Active`, `Completed`, `Cancelled`, `Rejected`) |
| `DELETE` | `/api/v1/bookings/:id` | Owner/Admin | Delete rental order record |

### 💳 Payments & Stripe Checkout (`/api/v1/payments`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/payments/config` | Public | Public Stripe publishable key & currency |
| `POST` | `/api/v1/payments/create-checkout-session` | Authenticated | Generate Stripe checkout session |
| `GET` | `/api/v1/payments/verify-session/:sessionId` | Authenticated | Verify transaction and metadata |

### ⭐ Reviews & Ratings (`/api/v1/reviews`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/reviews/equipment/:id` | Public | Get approved reviews for an equipment |
| `POST` | `/api/v1/reviews` | Customer | Submit verified rental review |
| `GET` | `/api/v1/reviews/admin` | Admin | Review moderation queue |
| `PATCH` | `/api/v1/reviews/:id/status` | Admin | Approve, reject, or hide review |

---

## ⚙️ Environment Configuration

Create a `.env` file in the root directory:

```env
PORT=5000
NODE_ENV=development
DB_USER=your_mongo_username
DB_PASS=your_mongo_password
DB_NAME=equiphub_db
DB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/equiphub_db?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_here
CLIENT_URL=http://localhost:3000

# Stripe Default Fallback Keys (Can also be managed from Admin Dashboard)
STRIPE_SECRET_KEY=sk_test_placeholder
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder

# SMTP Mail Server (Can also be managed from Admin Dashboard)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=support@equiphub.com
```

---

## 🚀 Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Run with automatic reload
npm run dev

# 3. Run production
npm start
```
