// controllers/expenseController.js
const { Expense, Company, Invoice } = require('../models');
const { annotateDuplicates, registerImport } = require('../services/importRegistry');
const { SOURCE_EXPENSE } = require('../utils/transactionFingerprint');

exports.getAllExpenses = async (req, res) => {
  try {
    // Načítame všetky výdavky so spoločnosťou a voliteľne s faktúrou
    const expenses = await Expense.findAll({
      include: [
        { model: Company, attributes: ['id', ['company_name', 'name']] },
        { model: Invoice, as: 'invoice', attributes: ['id', 'invoice_number'], required: false }
      ],
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

    // Načítame všetky výdavky (s pripojenou spoločnosťou a voliteľne faktúrou)
    let expenses = await Expense.findAll({
      include: [
        { model: Company, attributes: ['id', ['company_name', 'name']] },
        { model: Invoice, as: 'invoice', attributes: ['id', 'invoice_number'], required: false }
      ],
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
    const { id_company, name, description, price, deductibility, type, start_date, end_date, id_invoice, ntry_ref } = req.body;
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
      id_invoice: id_invoice || null,
      ntry_ref: ntry_ref || null,
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
    const { id_company, name, description, price, deductibility, type, start_date, end_date, id_invoice, ntry_ref } = req.body;
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
    expense.id_invoice = (id_invoice !== undefined && id_invoice !== '' && id_invoice != null) ? id_invoice : null;
    expense.ntry_ref = (ntry_ref !== undefined && ntry_ref !== '' && ntry_ref != null) ? ntry_ref : null;
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

// Kontrola duplicít EŠTE PRED importom - frontend si takto vie duplicitné
// riadky označiť a používateľ vidí, ktoré záznamy už v systéme sú.
exports.checkImportDuplicates = async (req, res) => {
  try {
    const records = req.body.expenses;
    if (!Array.isArray(records)) {
      return res.status(400).json({ error: "'expenses' must be an array" });
    }

    const annotated = await annotateDuplicates(records, SOURCE_EXPENSE);
    res.json({
      results: annotated.map(({ index, fingerprint, duplicate, duplicateInFile, matchedBy, existing }) => ({
        index,
        fingerprint,
        duplicate,
        duplicateInFile,
        matchedBy,
        existing,
      })),
      duplicateCount: annotated.filter(a => a.duplicate).length,
    });
  } catch (error) {
    console.error('Error checking expense import duplicates:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Polia, ktoré sa smú dostať do tabuľky expenses (zvyšok z XML zahodíme)
const EXPENSE_FIELDS = [
  'id_company', 'name', 'description', 'price', 'deductibility',
  'type', 'start_date', 'end_date', 'id_invoice', 'ntry_ref',
];

exports.importExpenses = async (req, res) => {
  try {
    const expensesData = req.body.expenses; // Očakávame pole výdavkov
    if (!Array.isArray(expensesData) || expensesData.length === 0) {
      return res.status(400).json({ error: 'Expenses data must be a non-empty array.' });
    }

    const annotated = await annotateDuplicates(expensesData, SOURCE_EXPENSE);

    // Staršie výdavky (naimportované ešte pred zavedením registra) majú vyplnený
    // len ntry_ref - preto kontrolujeme aj ten, nech ich vieme tiež rozpoznať.
    const ntryRefs = annotated.map(a => a.ntry_ref).filter(Boolean);
    const legacyRefs = new Set();
    if (ntryRefs.length > 0) {
      const legacy = await Expense.findAll({
        where: { ntry_ref: ntryRefs },
        attributes: ['ntry_ref'],
      });
      legacy.forEach(e => legacyRefs.add(e.ntry_ref));
    }

    const createdExpenses = [];
    const skipped = [];
    const failed = [];

    for (const item of annotated) {
      // force = používateľ vedome potvrdil, že to duplicita nie je
      const force = item.raw.force === true;
      const isDuplicate = item.duplicate || (item.ntry_ref && legacyRefs.has(item.ntry_ref));

      if (isDuplicate && !force) {
        skipped.push({
          index: item.index,
          name: item.raw.name,
          price: item.raw.price,
          start_date: item.raw.start_date,
          ntry_ref: item.ntry_ref,
          reason: item.duplicateInFile
            ? 'Duplicita v rámci nahratého súboru'
            : 'Transakcia už bola naimportovaná',
          matchedBy: item.matchedBy,
          existing: item.existing,
        });
        continue;
      }

      const payload = {};
      EXPENSE_FIELDS.forEach((field) => {
        if (item.raw[field] !== undefined) payload[field] = item.raw[field];
      });
      payload.final_price = parseFloat(payload.price) * (parseFloat(payload.deductibility) / 100);
      if (payload.type === 'jednorazova') payload.end_date = null;
      // Stĺpec expenses.ntry_ref je UNIQUE - pri vedome potvrdenej duplicite ho
      // preto nechávame prázdny, identitu záznamu drží register importov.
      if (isDuplicate) payload.ntry_ref = null;

      try {
        const expense = await Expense.create(payload);
        await registerImport(item, { id_expense: expense.id, force });
        createdExpenses.push(expense);
      } catch (createError) {
        // Jeden chybný riadok nesmie zhodiť celý import
        console.error(`Výdavok "${payload.name}" sa nepodarilo uložiť:`, createError.message);
        failed.push({
          index: item.index,
          name: item.raw.name,
          price: item.raw.price,
          start_date: item.raw.start_date,
          reason: createError.message,
        });
      }
    }

    if (skipped.length > 0) {
      console.log(`Import výdavkov: preskočených ${skipped.length} duplicitných záznamov.`);
    }

    res.status(201).json({
      message: 'Expenses imported successfully',
      expenses: createdExpenses,
      skipped,
      skippedDuplicates: skipped.length,
      importedCount: createdExpenses.length,
      failed,
      failedCount: failed.length,
    });
  } catch (error) {
    console.error('Error importing expenses:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
