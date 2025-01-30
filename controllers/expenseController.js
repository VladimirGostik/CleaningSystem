// controllers/expenseController.js

const { Expense, Company } = require('../models');
const { Op } = require('sequelize');

// GET /api/expenses
exports.getExpenses = async (req, res) => {
  try {
    const { type, month, year, companyId } = req.query;
    let whereClause = {};

    if (type) {
      whereClause.type = type;
    }

    if (companyId) {
      whereClause.id_company = companyId;
    }

    if (month && year) {
      const startDate = new Date(`${year}-${month}-01`);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);

      whereClause.start_date = {
        [Op.gte]: startDate,
        [Op.lt]: endDate,
      };
    } else if (year) {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);

      whereClause.start_date = {
        [Op.gte]: startDate,
        [Op.lt]: endDate,
      };
    }

    const expenses = await Expense.findAll({
      where: whereClause,
      include: [{ model: Company, attributes: ['id', 'company_name'] }],
      order: [['start_date', 'DESC']],
    });

    res.status(200).json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// POST /api/expenses
exports.createExpense = async (req, res) => {
  try {
    const {
      id_company,
      name,
      description,
      price,
      deductibility,
      type,
      start_date,
      duration_months, // Pre mesačné výdavky
    } = req.body;

    // Overenie povinných polí
    if (!id_company || !name || !price || deductibility === undefined || !type || !start_date) {
      return res.status(400).json({ error: 'Chýbajú povinné polia.' });
    }

    // Overenie typu
    if (!['jednorazova', 'mesacna'].includes(type)) {
      return res.status(400).json({ error: 'Neplatný typ výdavku.' });
    }

    let end_date = null;
    if (type === 'mesacna') {
      if (!duration_months || duration_months <= 0) {
        return res.status(400).json({ error: 'Pre mesačné výdavky je potrebná doba trvania (mesiace).' });
      }

      const startDate = new Date(start_date);
      end_date = new Date(startDate);
      end_date.setMonth(end_date.getMonth() + duration_months);
      end_date = end_date.toISOString().split('T')[0]; // YYYY-MM-DD
    }

    const final_price = price - (price * (deductibility/100));

    const newExpense = await Expense.create({
      id_company,
      name,
      description,
      price,
      deductibility,
      type,
      start_date,
      end_date,
      final_price,
    });

    res.status(201).json(newExpense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// PUT /api/expenses/:id
exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      id_company,
      name,
      description,
      price,
      deductibility,
      type,
      start_date,
      duration_months, // Pre mesačné výdavky
      end_date, // Pre ukončenie výdavku
    } = req.body;

    const expense = await Expense.findByPk(id);

    if (!expense) {
      return res.status(404).json({ error: 'Výdavok nenájdený.' });
    }

    // Ak je typ mesačný a meníme ho, treba spracovať ukončenie starého a vytvorenie nového
    if (expense.type === 'mesacna' && type === 'mesacna') {
      // Aktualizácia mesačného výdavku
      if (duration_months) {
        const startDate = new Date(start_date);
        const newEndDate = new Date(startDate);
        newEndDate.setMonth(newEndDate.getMonth() + duration_months);
        expense.end_date = newEndDate.toISOString().split('T')[0];
      }

      // Aktualizácia ostatných polí
      expense.id_company = id_company || expense.id_company;
      expense.name = name || expense.name;
      expense.description = description || expense.description;
      expense.price = price !== undefined ? price : expense.price;
      expense.deductibility = deductibility !== undefined ? deductibility : expense.deductibility;
      expense.type = type || expense.type;
      expense.start_date = start_date || expense.start_date;

      await expense.save();

      return res.status(200).json(expense);
    }

    // Ak meníme typ z mesačný na jednorazový alebo naopak
    if (expense.type !== type) {
      if (type === 'mesacna') {
        // Ukončenie pôvodného jednorazového výdavku a vytvorenie mesačného
        const startDate = new Date(start_date);
        const newEndDate = new Date(startDate);
        newEndDate.setMonth(newEndDate.getMonth() + duration_months);
        expense.type = type;
        expense.start_date = start_date;
        expense.end_date = newEndDate.toISOString().split('T')[0];
      } else {
        // Ukončenie pôvodného mesačného výdavku
        expense.type = type;
        expense.end_date = null;
      }

      // Aktualizácia ostatných polí
      expense.id_company = id_company || expense.id_company;
      expense.name = name || expense.name;
      expense.description = description || expense.description;
      expense.price = price !== undefined ? price : expense.price;
      expense.deductibility = deductibility !== undefined ? deductibility : expense.deductibility;

      await expense.save();

      return res.status(200).json(expense);
    }

    // Aktualizácia jednorazového výdavku
    expense.id_company = id_company || expense.id_company;
    expense.name = name || expense.name;
    expense.description = description || expense.description;
    expense.price = price !== undefined ? price : expense.price;
    expense.deductibility = deductibility !== undefined ? deductibility : expense.deductibility;
    expense.start_date = start_date || expense.start_date;

    if (type === 'mesacna' && duration_months) {
      const startDate = new Date(start_date);
      const newEndDate = new Date(startDate);
      newEndDate.setMonth(newEndDate.getMonth() + duration_months);
      expense.end_date = newEndDate.toISOString().split('T')[0];
    }

    if (end_date) {
      expense.end_date = end_date;
    }

    await expense.save();

    res.status(200).json(expense);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// DELETE /api/expenses/:id
exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findByPk(id);

    if (!expense) {
      return res.status(404).json({ error: 'Výdavok nenájdený.' });
    }

    await expense.destroy();

    res.status(200).json({ message: 'Výdavok úspešne vymazaný.' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
