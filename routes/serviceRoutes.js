// routes/serviceRoutes.js
const express = require('express');
const router = express.Router();
const serviceController = require('../controllers/serviceController');

// Získanie všetkých služieb pre konkrétnu faktúru
router.get('/invoice/:invoiceId', serviceController.getServicesByInvoiceId);

// Pridanie novej služby k faktúre
router.post('/invoice/:invoiceId', serviceController.addServiceToInvoice);

// Aktualizácia služby
router.put('/:id', serviceController.updateService);

// Vymazanie služby
router.delete('/:id', serviceController.deleteService);

module.exports = router;
