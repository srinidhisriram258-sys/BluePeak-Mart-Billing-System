const { pool } = require('../config/db');

class DashboardModel {
  static async getStats() {
    const [salesSum] = await pool.query('SELECT SUM(grand_total) as total_sales, COUNT(id) as total_bills FROM bills');
    const [productCount] = await pool.query('SELECT COUNT(id) as total_products FROM products');
    const [customerCount] = await pool.query('SELECT COUNT(id) as total_customers FROM customers');
    const [todaySalesSum] = await pool.query(
      'SELECT SUM(grand_total) as today_sales FROM bills WHERE DATE(bill_date) = CURDATE()'
    );
    const [lowStock] = await pool.query(
      'SELECT id, name, category, price, stock FROM products WHERE stock <= 5 ORDER BY stock ASC'
    );
    const [paymentBreakdown] = await pool.query(
      'SELECT payment_method, COUNT(id) as count, SUM(grand_total) as total FROM bills GROUP BY payment_method'
    );
    const [topProducts] = await pool.query(
      `SELECT p.name, SUM(bi.quantity) as total_sold, SUM(bi.total) as total_revenue
       FROM bill_items bi
       JOIN products p ON bi.product_id = p.id
       GROUP BY bi.product_id, p.name
       ORDER BY total_sold DESC
       LIMIT 5`
    );
    const [recentBills] = await pool.query(
      `SELECT b.id, b.invoice_number, b.grand_total, b.bill_date, b.payment_method, c.name as customer_name
       FROM bills b
       LEFT JOIN customers c ON b.customer_id = c.id
       ORDER BY b.bill_date DESC
       LIMIT 7`
    );

    return {
      totalSales: parseFloat(salesSum[0].total_sales || 0),
      totalBills: parseInt(salesSum[0].total_bills || 0, 10),
      totalProducts: parseInt(productCount[0].total_products || 0, 10),
      totalCustomers: parseInt(customerCount[0].total_customers || 0, 10),
      todaySales: parseFloat(todaySalesSum[0].today_sales || 0),
      lowStockProducts: lowStock,
      paymentBreakdown: paymentBreakdown.map(p => ({
        method: p.payment_method,
        count: parseInt(p.count, 10),
        total: parseFloat(p.total || 0)
      })),
      topProducts: topProducts.map(tp => ({
        name: tp.name,
        sold: parseInt(tp.total_sold, 10),
        revenue: parseFloat(tp.total_revenue || 0)
      })),
      recentBills: recentBills
    };
  }
}

module.exports = DashboardModel;
