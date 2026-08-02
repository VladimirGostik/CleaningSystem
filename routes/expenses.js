// routes/expenses.js
const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');

router.get('/all', expenseController.getAllExpenses);

router.get('/', expenseController.getExpenses);
router.post('/', expenseController.createExpense);
router.put('/:id', expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

// Kontrola duplicít pred samotným importom (nič neukladá)
router.post('/import/check', expenseController.checkImportDuplicates);
router.post('/import', expenseController.importExpenses);

module.exports = router;
