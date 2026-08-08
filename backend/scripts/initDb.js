const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function initializeDatabase() {
  console.log('===================================================');
  console.log(' Starting BluePeak Mart MySQL DB Initialization...');
  console.log('===================================================');

  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306', 10);
  const user = process.env.DB_USER || 'root';
  const password = process.env.DB_PASSWORD || '';

  let connection;
  try {
    connection = await mysql.createConnection({ host, port, user, password });
    console.log(`[MySQL] Connected to server ${host}:${port} as user '${user}'.`);

    await connection.query(`CREATE DATABASE IF NOT EXISTS billing_db;`);
    await connection.query(`USE billing_db;`);
    console.log("[MySQL] Verified database 'billing_db'.");

    // 1. Customers Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS customers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        email VARCHAR(100),
        address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Products Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        category VARCHAR(50) NOT NULL DEFAULT 'General',
        sku VARCHAR(100) UNIQUE,
        barcode VARCHAR(100) UNIQUE,
        price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        gst_percent DECIMAL(5, 2) NOT NULL DEFAULT 18.00,
        stock INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Safe Schema Migrations for products table
    const [skuCol] = await connection.query(`SHOW COLUMNS FROM products LIKE 'sku';`);
    if (skuCol.length === 0) {
      console.log("[Migration] Adding missing 'sku' column to products table...");
      await connection.query(`ALTER TABLE products ADD COLUMN sku VARCHAR(100) UNIQUE AFTER category;`);
    }

    const [barcodeCol] = await connection.query(`SHOW COLUMNS FROM products LIKE 'barcode';`);
    if (barcodeCol.length === 0) {
      console.log("[Migration] Adding missing 'barcode' column to products table...");
      await connection.query(`ALTER TABLE products ADD COLUMN barcode VARCHAR(100) UNIQUE AFTER sku;`);
    }

    const [gstCol] = await connection.query(`SHOW COLUMNS FROM products LIKE 'gst_percent';`);
    if (gstCol.length === 0) {
      console.log("[Migration] Adding missing 'gst_percent' column to products table...");
      await connection.query(`ALTER TABLE products ADD COLUMN gst_percent DECIMAL(5, 2) NOT NULL DEFAULT 18.00 AFTER price;`);
    }

    // 3. Bills Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS bills (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_number VARCHAR(50) NOT NULL UNIQUE,
        customer_id INT NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        discount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        gst DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        grand_total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        payment_method ENUM('Cash', 'Card', 'UPI') NOT NULL DEFAULT 'Cash',
        amount_received DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        change_returned DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        bill_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Safe Schema Migrations for bills table
    const [amtCol] = await connection.query(`SHOW COLUMNS FROM bills LIKE 'amount_received';`);
    if (amtCol.length === 0) {
      await connection.query(`ALTER TABLE bills ADD COLUMN amount_received DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER payment_method;`);
    }

    const [chgCol] = await connection.query(`SHOW COLUMNS FROM bills LIKE 'change_returned';`);
    if (chgCol.length === 0) {
      await connection.query(`ALTER TABLE bills ADD COLUMN change_returned DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER amount_received;`);
    }

    // 4. Bill Items Table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS bill_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        bill_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        FOREIGN KEY (bill_id) REFERENCES bills(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Insert Default Customers
    await connection.query(`
      INSERT IGNORE INTO customers (id, name, phone, email, address) VALUES
      (1, 'Karthik Subramanian', '+91 98401 23456', 'karthik.s@gmail.com', '12 MTH Road, Avadi, Chennai, TN'),
      (2, 'Priya Raman', '+91 98410 87654', 'priya.r@outlook.com', '45 Gandhi Nagar, Avadi, Chennai, TN'),
      (3, 'Vijay Kumar', '+91 97900 34567', 'vijay.k@techcorp.in', '78 NM Road, Avadi, Chennai, TN'),
      (4, 'Anitha Lakshmi', '+91 98840 98765', 'anitha.l@yahoo.co.in', '34 Periyar Nagar, Avadi, Chennai, TN');
    `);

    console.log('===================================================');
    console.log(" SUCCESS: BluePeak Mart 'billing_db' schema ready!");
    console.log(" Run 'npm run seed' to populate 500 retail products.");
    console.log('===================================================');
  } catch (error) {
    console.error('===================================================');
    console.error(' FAILED to initialize MySQL database.');
    console.error(` Error (${error.code || 'UNKNOWN'}): ${error.message}`);
    console.error('===================================================');
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

initializeDatabase();
