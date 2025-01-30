// routes/invoiceRoutes.js
const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');

// Bulk Actions Routes - musia byť definované pred dynamickou routou
router.put('/bulk-update-status', invoiceController.bulkUpdateStatus);
router.post('/bulk-delete', invoiceController.bulkDeleteInvoices);

// Vytvorenie novej faktúry
router.post('/', invoiceController.createInvoice);

// Získanie všetkých faktúr
router.get('/', invoiceController.getAllInvoices);

// Získanie faktúry podľa ID
router.get('/:id', invoiceController.getInvoiceById);

// routes/invoiceRoutes.js
router.get('/last-number/:companyId/:year', invoiceController.getLastInvoiceNumber);

router.post('/generate-monthly', invoiceController.generateMonthlyInvoices);

// Aktualizácia faktúry
router.put('/:id', invoiceController.updateInvoice);

// Vymazanie faktúry
router.delete('/:id', invoiceController.deleteInvoice);

module.exports = router;
