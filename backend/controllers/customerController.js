const CustomerModel = require('../models/customerModel');

class CustomerController {
  static async getAll(req, res, next) {
    try {
      const { search } = req.query;
      const customers = await CustomerModel.getAll(search);
      res.json({ success: true, data: customers });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'Invalid customer ID.' });
      }

      const customer = await CustomerModel.getById(id);
      if (!customer) {
        return res.status(404).json({ success: false, message: 'Customer not found.' });
      }

      const bills = await CustomerModel.getBillsByCustomerId(id);
      customer.billing_history = bills;

      res.json({ success: true, data: customer });
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const { name, phone, email, address } = req.body;

      if (!name || name.trim() === '') {
        return res.status(400).json({ success: false, message: 'Customer name is required.' });
      }

      if (!phone || phone.trim() === '') {
        return res.status(400).json({ success: false, message: 'Customer phone number is required.' });
      }

      const newCustomer = await CustomerModel.create({
        name: name.trim(),
        phone: phone.trim(),
        email: email ? email.trim() : '',
        address: address ? address.trim() : ''
      });

      res.status(201).json({ success: true, message: 'Customer created successfully.', data: newCustomer });
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'Invalid customer ID.' });
      }

      const existing = await CustomerModel.getById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Customer not found.' });
      }

      const { name, phone, email, address } = req.body;

      if (!name || name.trim() === '') {
        return res.status(400).json({ success: false, message: 'Customer name is required.' });
      }

      if (!phone || phone.trim() === '') {
        return res.status(400).json({ success: false, message: 'Customer phone number is required.' });
      }

      const updatedCustomer = await CustomerModel.update(id, {
        name: name.trim(),
        phone: phone.trim(),
        email: email ? email.trim() : '',
        address: address ? address.trim() : ''
      });

      res.json({ success: true, message: 'Customer updated successfully.', data: updatedCustomer });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'Invalid customer ID.' });
      }

      const existing = await CustomerModel.getById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Customer not found.' });
      }

      const deleted = await CustomerModel.delete(id);
      if (!deleted) {
        return res.status(500).json({ success: false, message: 'Failed to delete customer.' });
      }

      res.json({ success: true, message: 'Customer deleted successfully.' });
    } catch (error) {
      if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete customer because they have existing invoice history.'
        });
      }
      next(error);
    }
  }
}

module.exports = CustomerController;
