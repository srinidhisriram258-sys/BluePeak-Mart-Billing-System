const express = require('express');
const router = express.Router();
const BillController = require('../controllers/billController');

router.get('/', BillController.getAll);
router.get('/:id', BillController.getById);
router.post('/', BillController.create);
router.delete('/:id', BillController.delete);

module.exports = router;
