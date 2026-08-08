# ⚡ CloudBill - Real-World POS Billing Management System

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v4.19-blue.svg)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0+-orange.svg)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

A commercial-grade, real-world **POS Billing & Cashier System** featuring a 3D dark glassmorphism SaaS UI layout, barcode/SKU scanning, multi-method payment modal with cash change calculation, keyboard shortcuts (`F2`, `F4`, `F8`), printable receipt studio, owner authentication protection, and Express REST API backend with MySQL integration.

---

## 🌟 Key Features

### 🧾 1. Default POS Cashier Screen (Main Home Page)
- **Primary Screen on Load**: Launches directly into the cashier billing counter interface at `http://localhost:5000`.
- **Two-Column Layout**:
  - **Left**: Barcode/SKU Scanner input + Product Catalog Grid with category pills and stock availability tags (`In Stock`, `Low Stock`, `Out of Stock`).
  - **Right**: Active Cart table, line-item quantity adjusters, customer selector, subtotal, discount, GST tax (18%), grand total, and Pay button.

### 🔍 2. Barcode & SKU Scanning Engine
- USB Barcode Scanner support (simulates rapid input + `Enter`).
- Barcode/SKU search endpoint (`GET /api/products/scan/:code`).
- Instant product lookup by SKU (e.g. `SKU-1001`), barcode, or product ID.
- Automatically increments item quantity in cart when scanned multiple times.

### 💳 3. Multi-Method Payment & Cash Change System
- Payment Checkout Modal triggered by **`PAY / CHECKOUT`** button or **`F4`** shortcut.
- Selectable Payment Method Tabs: **Cash**, **UPI / GPay**, **Card**.
- **Cash Change Calculator**:
  - Real-time `Change to Return = Amount Received - Grand Total`.
  - Cash preset buttons (`Exact`, `$50`, `$100`, `$500`).
  - **Insufficient Payment Guard**: Disables checkout and shows warning if received cash is less than total amount.

### 🔑 4. Owner / Admin Authentication System
- Cashier operates the POS Billing screen without login.
- Administrative screens (Dashboard, Products CRUD, Customers CRUD, Billing History, Settings) are locked behind Owner Authentication.
- Auth endpoints (`POST /api/auth/login`, `GET /api/auth/verify`) check `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `backend/.env`.
- Frontend Modal prompts for Owner Login when accessing protected views.

### ⌨️ 5. POS Keyboard Shortcuts
- **`F2`**: Focus Barcode / SKU Search field
- **`F4`**: Open Payment Checkout Modal
- **`F8`**: Clear Current Cart
- **`Enter`**: Submit Barcode Scan / Add item
- **`Esc`**: Close open modal dialogs

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | HTML5, CSS3 (3D Glassmorphism), Vanilla JavaScript (ES6+), Chart.js (CDN), Font Awesome 6 |
| **Backend** | Node.js, Express.js REST API |
| **Database** | MySQL 8.0+ (`mysql2/promise` pool connection) |
| **Security & Auth** | Owner Token Authentication, CORS, dotenv, Centralized Error Handling |

---

## 🗄️ Database Setup

Run the initialization script from the project root or `backend/` directory:

```bash
npm run init-db
```

Or manually execute `database/init.sql` in MySQL:
```sql
SOURCE database/init.sql;
```

This creates `billing_db`, updates tables with `sku`, `amount_received`, and `change_returned` fields, and inserts sample POS catalog items.

---

## 🚀 Quick Start & Installation

### 1. Configure Environment Variables
Update `backend/.env` with your MySQL password and owner credentials:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_actual_mysql_password
DB_NAME=billing_db

ADMIN_USERNAME=admin
ADMIN_PASSWORD=CHANGE_ME
```

### 2. Run Application
From root:
```bash
npm start
```
Or from `backend/`:
```bash
cd backend
npm install
npm start
```

### 3. Open in Browser
Navigate to **`http://localhost:5000`** in your browser.

---

## 📡 API Endpoints Reference

### 🔐 Auth (`/api/auth`)
- `POST /api/auth/login` - Authenticate store owner
- `GET /api/auth/verify` - Verify owner session token

### 📦 Products (`/api/products`)
- `GET /api/products` - Fetch product catalog (optional `search`, `category`)
- `GET /api/products/scan/:code` - Scan product by SKU or Barcode
- `POST /api/products` - Create new product (Protected)
- `PUT /api/products/:id` - Update product & SKU (Protected)
- `DELETE /api/products/:id` - Delete product (Protected)

### 🧾 Invoices & Bills (`/api/bills`)
- `GET /api/bills` - Fetch invoice ledger
- `GET /api/bills/:id` - Fetch detailed receipt line-items
- `POST /api/bills` - Process POS checkout, save cash/change, deduct inventory stock
- `DELETE /api/bills/:id` - Delete invoice & restore product stock (Protected)

### 📊 Dashboard & Health (`/api/dashboard` & `/api/health`)
- `GET /api/dashboard/stats` - Analytics KPIs, payment breakdown (Protected)
- `GET /api/health` - Server and MySQL connectivity status check

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
