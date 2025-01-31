// routes/invoiceRoutes.js
const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');

// routes/invoiceRoutes.js
router.get('/last-number', invoiceController.getLastInvoiceNumber); 

router.post('/generate-monthly', invoiceController.generateMonthlyInvoices);

// Bulk Actions Routes - musia byť definované pred dynamickou routou
router.put('/bulk-update-status', invoiceController.bulkUpdateStatus);

router.post('/bulk-delete', invoiceController.bulkDeleteInvoices);
// Získanie faktúry podľa ID
router.get('/:id', invoiceController.getInvoiceById);

// Vytvorenie novej faktúry
router.post('/', invoiceController.createInvoice);

// Aktualizácia faktúry
router.put('/:id', invoiceController.updateInvoice);

// Vymazanie faktúry
router.delete('/:id', invoiceController.deleteInvoice);

// Získanie všetkých faktúr
router.get('/', invoiceController.getAllInvoices);
 
module.exports = router;
