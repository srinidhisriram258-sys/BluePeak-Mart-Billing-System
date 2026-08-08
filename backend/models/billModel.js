const { pool } = require('../config/db');

class BillModel {
  static async getAll(search = '', paymentMethod = '') {
    let query = `
      SELECT b.*, c.name as customer_name, c.phone as customer_phone
      FROM bills b
      LEFT JOIN customers c ON b.customer_id = c.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (b.invoice_number LIKE ? OR c.name LIKE ? OR c.phone LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (paymentMethod && paymentMethod !== 'All') {
      query += ` AND b.payment_method = ?`;
      params.push(paymentMethod);
    }

    query += ` ORDER BY b.bill_date DESC`;
    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async getById(id) {
    const [bills] = await pool.query(
      `SELECT b.*, c.name as customer_name, c.phone as customer_phone, c.email as customer_email, c.address as customer_address
       FROM bills b
       LEFT JOIN customers c ON b.customer_id = c.id
       WHERE b.id = ?`,
      [id]
    );

    if (bills.length === 0) {
      return null;
    }

    const bill = bills[0];

    const [items] = await pool.query(
      `SELECT bi.*, p.name as product_name, p.category as product_category, p.sku as product_sku
       FROM bill_items bi
       LEFT JOIN products p ON bi.product_id = p.id
       WHERE bi.bill_id = ?`,
      [id]
    );

    bill.items = items;
    return bill;
  }

  static async generateInvoiceNumber(connection) {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;
    const [rows] = await connection.query(
      `SELECT invoice_number FROM bills WHERE invoice_number LIKE ? ORDER BY id DESC LIMIT 1`,
      [`${prefix}%`]
    );

    let nextNumber = 1001;
    if (rows.length > 0) {
      const lastInvoice = rows[0].invoice_number;
      const parts = lastInvoice.split('-');
      if (parts.length === 3 && !isNaN(parseInt(parts[2], 10))) {
        nextNumber = parseInt(parts[2], 10) + 1;
      }
    }
    return `${prefix}${nextNumber}`;
  }

  static async create({ customer_id, items, discount = 0, gst = 0, payment_method = 'Cash', amount_received = 0, change_returned = 0 }) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      if (!items || items.length === 0) {
        throw new Error('Invoice must contain at least one product item.');
      }

      // Default to guest/first customer if customer_id not provided
      let validCustomerId = parseInt(customer_id, 10);
      if (isNaN(validCustomerId)) {
        const [customers] = await connection.query('SELECT id FROM customers ORDER BY id ASC LIMIT 1');
        if (customers.length > 0) {
          validCustomerId = customers[0].id;
        } else {
          // Create default guest customer
          const [guestRes] = await connection.query(
            `INSERT INTO customers (name, phone, email, address) VALUES ('Walk-in Customer', '+1 (555) 000-0000', '', '')`
          );
          validCustomerId = guestRes.insertId;
        }
      }

      // Validate stock & compute totals
      let calculatedSubtotal = 0;
      const processedItems = [];

      for (const item of items) {
        const [products] = await connection.query('SELECT * FROM products WHERE id = ?', [item.product_id]);
        if (products.length === 0) {
          throw new Error(`Product ID ${item.product_id} not found.`);
        }

        const product = products[0];
        const qty = parseInt(item.quantity, 10);
        if (isNaN(qty) || qty <= 0) {
          throw new Error(`Invalid quantity for product "${product.name}".`);
        }

        if (product.stock < qty) {
          throw new Error(`Insufficient stock for "${product.name}". Available: ${product.stock}, requested: ${qty}.`);
        }

        const itemPrice = parseFloat(product.price);
        const itemTotal = itemPrice * qty;
        calculatedSubtotal += itemTotal;

        processedItems.push({
          product_id: product.id,
          quantity: qty,
          price: itemPrice,
          total: itemTotal
        });
      }

      const numDiscount = parseFloat(discount) || 0;
      const numGst = parseFloat(gst) || 0;
      const grandTotal = Math.max(0, calculatedSubtotal - numDiscount + numGst);

      const numAmountReceived = parseFloat(amount_received) || grandTotal;
      const numChangeReturned = parseFloat(change_returned) || Math.max(0, numAmountReceived - grandTotal);

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber(connection);

      // Insert bill record
      const [billResult] = await connection.query(
        `INSERT INTO bills (invoice_number, customer_id, subtotal, discount, gst, grand_total, payment_method, amount_received, change_returned, bill_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [invoiceNumber, validCustomerId, calculatedSubtotal, numDiscount, numGst, grandTotal, payment_method, numAmountReceived, numChangeReturned]
      );

      const billId = billResult.insertId;

      // Insert bill items & update stock
      for (const item of processedItems) {
        await connection.query(
          `INSERT INTO bill_items (bill_id, product_id, quantity, price, total)
           VALUES (?, ?, ?, ?, ?)`,
          [billId, item.product_id, item.quantity, item.price, item.total]
        );

        await connection.query(
          `UPDATE products SET stock = stock - ? WHERE id = ?`,
          [item.quantity, item.product_id]
        );
      }

      await connection.commit();
      connection.release();

      return await this.getById(billId);
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  }

  static async delete(id) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Fetch items to restore stock
      const [items] = await connection.query('SELECT product_id, quantity FROM bill_items WHERE bill_id = ?', [id]);

      for (const item of items) {
        await connection.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
      }

      const [result] = await connection.query('DELETE FROM bills WHERE id = ?', [id]);

      await connection.commit();
      connection.release();
      return result.affectedRows > 0;
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  }
}

module.exports = BillModel;
