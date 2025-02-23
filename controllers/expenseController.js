// controllers/expenseController.js
const { Expense, Company } = require('../models');

exports.getAllExpenses = async (req, res) => {
  try {
    // Načítame všetky výdavky so spoločnosťou (ak je potrebné)
    const expenses = await Expense.findAll({
      include: [{
        model: Company,
        attributes: ['id', ['company_name', 'name']]
      }],
    });
    res.status(200).json(expenses);
  } catch (error) {
    console.error('Error fetching all expenses:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getExpenses = async (req, res) => {
  try {
    const { month, year } = req.query;
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    // Vytvoríme objekt predstavujúci začiatok aktuálneho mesiaca
    const currentMonthStart = new Date(yearNum, monthNum - 1, 1);

    // Načítame všetky výdavky (s pripojenou spoločnosťou aliasovanou)
    let expenses = await Expense.findAll({
      include: [{
        model: Company,
        attributes: ['id', ['company_name', 'name']]
      }],
    });

    // Filtrovanie výdavkov podľa typu a dátumov
    expenses = expenses.filter(exp => {
      // Pre jednorazové výdavky: kontrolujeme, či dátum zodpovedá aktuálnemu mesiacu a roku.
      const expStart = new Date(exp.start_date);
      if (exp.type === 'jednorazova') {
        return expStart.getMonth() + 1 === monthNum && expStart.getFullYear() === yearNum;
      }
      // Pre mesačné výdavky:
      else if (exp.type === 'mesacna') {
        // Ak aktuálny mesiac je pred dátumom začiatku, výdavok ešte nezačal.
        if (currentMonthStart < expStart) {
          return false;
        }
        // Ak je nastavený end_date, overíme, že aktuálny mesiac je pred alebo v tomto dátume.
        if (exp.end_date) {
          const expEnd = new Date(exp.end_date);
          if (currentMonthStart > expEnd) {
            return false;
          }
        }
        // Inak sa výdavok zobrazí.
        return true;
      }
      return false;
    });

    res.json(expenses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createExpense = async (req, res) => {
  try {
    const { id_company, name, description, price, deductibility, type, start_date, end_date } = req.body;
    if (!id_company || !name || !price || !deductibility || !type || !start_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    // Vypočítame final_price: cena * (deductibility / 100)
    const computedFinalPrice = parseFloat(price) * (parseFloat(deductibility) / 100);

    const expense = await Expense.create({
      id_company,
      name,
      description,
      price,
      deductibility,
      final_price: computedFinalPrice,
      type,
      start_date,
      end_date: type === 'jednorazova' ? null : end_date,
    });
    res.status(201).json(expense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const expenseId = req.params.id;
    const { id_company, name, description, price, deductibility, type, start_date, end_date } = req.body;
    const expense = await Expense.findByPk(expenseId);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    // Aktualizácia hodnôt vrátane final_price
    expense.id_company = id_company;
    expense.name = name;
    expense.description = description;
    expense.price = price;
    expense.deductibility = deductibility;
    expense.final_price = parseFloat(price) * (parseFloat(deductibility) / 100);
    expense.type = type;
    expense.start_date = start_date;
    expense.end_date = type === 'jednorazova' ? null : end_date;
    await expense.save();
    res.json(expense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const expenseId = req.params.id;
    const expense = await Expense.findByPk(expenseId);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    await expense.destroy();
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.importExpenses = async (req, res) => {
  try {
    const expensesData = req.body.expenses; // Očakávame pole výdavkov
    if (!Array.isArray(expensesData) || expensesData.length === 0) {
      return res.status(400).json({ error: 'Expenses data must be a non-empty array.' });
    }

    // Pred vytvorením každého výdavku vypočítame aj final_price
    const expensesWithFinalPrice = expensesData.map(expData => {
      const computedFinalPrice = parseFloat(expData.price) * (parseFloat(expData.deductibility) / 100);
      return { ...expData, final_price: computedFinalPrice };
    });

    // Vytvorenie výdavkov pomocou bulkCreate
    const createdExpenses = await Expense.bulkCreate(expensesWithFinalPrice);
    res.status(201).json({ message: 'Expenses imported successfully', expenses: createdExpenses });
  } catch (error) {
    console.error('Error importing expenses:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
