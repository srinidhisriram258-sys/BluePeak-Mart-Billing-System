const { pool } = require('../config/db');

class CustomerModel {
  static async getAll(search = '') {
    let query = 'SELECT * FROM customers';
    const params = [];

    if (search) {
      query += ' WHERE name LIKE ? OR phone LIKE ? OR email LIKE ?';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async getById(id) {
    const [rows] = await pool.query('SELECT * FROM customers WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async create({ name, phone, email, address }) {
    const [result] = await pool.query(
      'INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)',
      [name, phone, email || '', address || '']
    );
    return this.getById(result.insertId);
  }

  static async update(id, { name, phone, email, address }) {
    await pool.query(
      'UPDATE customers SET name = ?, phone = ?, email = ?, address = ? WHERE id = ?',
      [name, phone, email || '', address || '', id]
    );
    return this.getById(id);
  }

  static async delete(id) {
    const [result] = await pool.query('DELETE FROM customers WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  static async getBillsByCustomerId(customerId) {
    const [rows] = await pool.query(
      `SELECT b.*, c.name as customer_name 
       FROM bills b 
       JOIN customers c ON b.customer_id = c.id 
       WHERE b.customer_id = ? 
       ORDER BY b.bill_date DESC`,
      [customerId]
    );
    return rows;
  }
}

module.exports = CustomerModel;
