const BillModel = require('../models/billModel');

class BillController {
  static async getAll(req, res, next) {
    try {
      const { search, payment_method } = req.query;
      const bills = await BillModel.getAll(search, payment_method);
      res.json({ success: true, data: bills });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'Invalid invoice ID.' });
      }

      const bill = await BillModel.getById(id);
      if (!bill) {
        return res.status(404).json({ success: false, message: 'Invoice not found.' });
      }

      res.json({ success: true, data: bill });
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const { customer_id, items, discount, gst, payment_method, amount_received, change_returned } = req.body;

      if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Please add at least one product item to the bill.' });
      }

      const validPaymentMethods = ['Cash', 'Card', 'UPI'];
      const selectedPayment = validPaymentMethods.includes(payment_method) ? payment_method : 'Cash';

      const createdBill = await BillModel.create({
        customer_id: customer_id ? parseInt(customer_id, 10) : null,
        items,
        discount: parseFloat(discount) || 0,
        gst: parseFloat(gst) || 0,
        payment_method: selectedPayment,
        amount_received: parseFloat(amount_received) || 0,
        change_returned: parseFloat(change_returned) || 0
      });

      res.status(201).json({
        success: true,
        message: `Invoice ${createdBill.invoice_number} generated successfully.`,
        data: createdBill
      });
    } catch (error) {
      if (error.message.includes('stock') || error.message.includes('customer') || error.message.includes('product')) {
        return res.status(400).json({ success: false, message: error.message });
      }
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'Invalid invoice ID.' });
      }

      const existing = await BillModel.getById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Invoice not found.' });
      }

      const deleted = await BillModel.delete(id);
      if (!deleted) {
        return res.status(500).json({ success: false, message: 'Failed to delete invoice.' });
      }

      res.json({ success: true, message: `Invoice ${existing.invoice_number} deleted and stock restored.` });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = BillController;
