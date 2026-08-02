// routes/invoiceRoutes.js
const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');

// Označenie faktúry ako zaplatené
router.put('/:invoiceId/mark-as-paid', invoiceController.markInvoiceAsPaid);

// Označenie faktúry ako odoslané
router.put('/:invoiceId/mark-as-sent', invoiceController.markInvoiceAsSent);

router.post('/generate-monthly', invoiceController.generateMonthlyInvoices);

router.post('/generate-monthly-for-company', invoiceController.generateMonthlyInvoicesForCompany);

// Bulk Actions Routes - musia byť definované pred dynamickou routou
router.put('/bulk-update-status', invoiceController.bulkUpdateStatus);

// Kontrola duplicít pred importom platieb (nič neukladá)
router.post('/transactions/check-duplicates', invoiceController.checkTransactionDuplicates);

router.put('/update-from-transactions', invoiceController.updateInvoicesFromTransactions);

router.post('/bulk-delete', invoiceController.bulkDeleteInvoices);

router.put('/bulk-update-dates', invoiceController.bulkUpdateInvoiceDates);

// Štatistiky a špeciálne GET routy musia byť PRED /:id (inak "statistics" / "last-number" sa interpretujú ako id)
router.get('/statistics', invoiceController.getInvoiceStatistics);
router.get('/last-number', invoiceController.getLastInvoiceNumber);
// Získanie všetkých faktúr (musí byť pred /:id)
router.get('/', invoiceController.getAllInvoices);
// Získanie faktúry podľa ID
router.get('/:id', invoiceController.getInvoiceById);

// Vytvorenie novej faktúry
router.post('/', invoiceController.createInvoice);

// Uložiť faktúru a prekopírovať zmeny do mesačnej šablóny (pred PUT /:id)
router.put('/:id/save-and-sync-to-monthly', invoiceController.updateInvoiceAndSyncToMonthly);
// Aktualizácia faktúry
router.put('/:id', invoiceController.updateInvoice);

// Vymazanie faktúry
router.delete('/:id', invoiceController.deleteInvoice);
 
module.exports = router;
