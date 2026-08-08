const { pool } = require('../config/db');

class ProductModel {
  static async getAll(search = '', category = '') {
    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (search) {
      query += ' AND (name LIKE ? OR category LIKE ? OR sku LIKE ? OR barcode LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (category && category !== 'All') {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(query, params);
    return rows;
  }

  static async getById(id) {
    const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async getBySkuOrBarcode(code) {
    const cleanCode = (code || '').trim();
    if (!cleanCode) return null;

    const [rows] = await pool.query(
      'SELECT * FROM products WHERE barcode = ? OR sku = ? OR name = ? OR id = ? LIMIT 1',
      [cleanCode, cleanCode, cleanCode, isNaN(parseInt(cleanCode, 10)) ? 0 : parseInt(cleanCode, 10)]
    );
    return rows[0] || null;
  }

  static async create({ name, category, sku, barcode, price, gst_percent, stock }) {
    const autoSku = sku && sku.trim() !== '' ? sku.trim() : `BPM-GEN-${Date.now().toString().slice(-6)}`;
    const autoBarcode = barcode && barcode.trim() !== '' ? barcode.trim() : `890${Date.now().toString().slice(-10)}`;

    const [result] = await pool.query(
      'INSERT INTO products (name, category, sku, barcode, price, gst_percent, stock) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        name,
        category || 'General',
        autoSku,
        autoBarcode,
        parseFloat(price) || 0,
        parseFloat(gst_percent) || 18.00,
        parseInt(stock, 10) || 0
      ]
    );
    return this.getById(result.insertId);
  }

  static async update(id, { name, category, sku, barcode, price, gst_percent, stock }) {
    const autoSku = sku && sku.trim() !== '' ? sku.trim() : `BPM-GEN-${id}`;
    const autoBarcode = barcode && barcode.trim() !== '' ? barcode.trim() : `8901234000${id}`;

    await pool.query(
      'UPDATE products SET name = ?, category = ?, sku = ?, barcode = ?, price = ?, gst_percent = ?, stock = ? WHERE id = ?',
      [
        name,
        category || 'General',
        autoSku,
        autoBarcode,
        parseFloat(price) || 0,
        parseFloat(gst_percent) || 18.00,
        parseInt(stock, 10) || 0,
        id
      ]
    );
    return this.getById(id);
  }

  static async delete(id) {
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = ProductModel;
