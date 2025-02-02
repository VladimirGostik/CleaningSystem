// controllers/expenseController.js
const { Expense, Company } = require('../models');

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
    const expense = await Expense.create({
      id_company,
      name,
      description,
      price,
      deductibility,
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
    expense.id_company = id_company;
    expense.name = name;
    expense.description = description;
    expense.price = price;
    expense.deductibility = deductibility;
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
