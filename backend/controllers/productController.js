const ProductModel = require('../models/productModel');

class ProductController {
  static async getAll(req, res, next) {
    try {
      const { search, category } = req.query;
      const products = await ProductModel.getAll(search, category);
      res.json({ success: true, data: products });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'Invalid product ID.' });
      }

      const product = await ProductModel.getById(id);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Product not found.' });
      }

      res.json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  }

  static async scanBarcode(req, res, next) {
    try {
      const code = req.params.code;
      if (!code || code.trim() === '') {
        return res.status(400).json({ success: false, message: 'Please scan a valid SKU or barcode.' });
      }

      const product = await ProductModel.getBySkuOrBarcode(code.trim());
      if (!product) {
        return res.status(404).json({ success: false, message: `Product Not Found for code: "${code}"` });
      }

      res.json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const { name, category, sku, barcode, price, gst_percent, stock } = req.body;

      if (!name || name.trim() === '') {
        return res.status(400).json({ success: false, message: 'Product name is required.' });
      }

      if (price === undefined || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
        return res.status(400).json({ success: false, message: 'Valid non-negative price is required.' });
      }

      if (stock === undefined || isNaN(parseInt(stock, 10)) || parseInt(stock, 10) < 0) {
        return res.status(400).json({ success: false, message: 'Valid stock quantity is required.' });
      }

      const newProduct = await ProductModel.create({
        name: name.trim(),
        category: category ? category.trim() : 'General',
        sku: sku ? sku.trim() : '',
        barcode: barcode ? barcode.trim() : '',
        price: parseFloat(price),
        gst_percent: parseFloat(gst_percent) || 18.00,
        stock: parseInt(stock, 10)
      });

      res.status(201).json({ success: true, message: 'Product created successfully.', data: newProduct });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ success: false, message: 'Product with this SKU or barcode already exists.' });
      }
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'Invalid product ID.' });
      }

      const existing = await ProductModel.getById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Product not found.' });
      }

      const { name, category, sku, barcode, price, gst_percent, stock } = req.body;

      if (!name || name.trim() === '') {
        return res.status(400).json({ success: false, message: 'Product name is required.' });
      }

      const updatedProduct = await ProductModel.update(id, {
        name: name.trim(),
        category: category ? category.trim() : 'General',
        sku: sku ? sku.trim() : '',
        barcode: barcode ? barcode.trim() : '',
        price: parseFloat(price),
        gst_percent: parseFloat(gst_percent) || 18.00,
        stock: parseInt(stock, 10)
      });

      res.json({ success: true, message: 'Product updated successfully.', data: updatedProduct });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({ success: false, message: 'Product with this SKU or barcode already exists.' });
      }
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'Invalid product ID.' });
      }

      const deleted = await ProductModel.delete(id);
      if (!deleted) {
        return res.status(500).json({ success: false, message: 'Failed to delete product.' });
      }

      res.json({ success: true, message: 'Product deleted successfully.' });
    } catch (error) {
      if (error.code === 'ER_ROW_IS_REFERENCED_2') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete product because it is referenced in past bills.'
        });
      }
      next(error);
    }
  }
}

module.exports = ProductController;
