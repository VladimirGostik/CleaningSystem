// controllers/invoiceController.js
const { Sequelize, Op } = require('sequelize');
const { Invoice, MonthlyInvoice, Service, ServicePlanned , Company} = require('../models');

// Vytvorenie novej faktúry s pridruženými službami
exports.createInvoice = async (req, res) => {
  try {
    const { services, ...invoiceData } = req.body;

    // Vytvoríme faktúru
    const invoice = await Invoice.create(invoiceData);

    // Ak sú služby zahrnuté, pridáme ich
    if (services && services.length > 0) {
      const servicesData = services.map(service => ({
        ...service,
        invoice_id: invoice.id,
      }));
      await Service.bulkCreate(servicesData);
    }

    // Načítame faktúru s pridruženými službami
    const createdInvoice = await Invoice.findByPk(invoice.id, {
      include: [{ model: Service, as: 'services' }],
    });

    res.status(201).json(createdInvoice);
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Získanie všetkých faktúr
exports.getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.findAll({
      include: [
        { 
          model: Service, 
          as: 'services',
          attributes: ['id', 'name', 'price', 'quantity', 'invoice_id'], // Only select needed fields
          separate: true, // This prevents N+1 by using a separate query with IN clause
        }
      ],
      order: [['issue_date', 'DESC'], ['id', 'DESC']], // Order by date and id
    });
    res.status(200).json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Získanie konkrétnej faktúry podľa ID
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id, {
      include: [{ model: Service, as: 'services' }],
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.status(200).json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.getLastInvoiceNumber = async (req, res) => {
  const { selectedCompany, invoiceYear } = req.query; // <-- dôležitá zmena

  if (!selectedCompany || !invoiceYear) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    const lastInvoice = await Invoice.findOne({
      where: {
        id_company: selectedCompany,
        issue_date: {
          [Op.between]: [`${invoiceYear}-01-01`, `${invoiceYear}-12-31`],
        },
      },
      order: [['invoice_number', 'DESC']],
    });

    res.json({
      lastInvoiceNumber: lastInvoice ? lastInvoice.invoice_number : null,
    });
  } catch (error) {
    console.error('Error fetching last invoice number:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// Aktualizácia faktúry
// controllers/invoiceController.js

exports.updateInvoice = async (req, res) => {
  try {
    const { services, ...invoiceData } = req.body;
    const invoice = await Invoice.findByPk(req.params.id);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Update invoice fields
    invoice.set(invoiceData);

    // Save changes
    await invoice.save();

    // Update services
    if (services && Array.isArray(services)) {
      await Service.destroy({ where: { invoice_id: invoice.id } });
      const servicesData = services.map((service) => ({
        ...service,
        invoice_id: invoice.id,
      }));
      await Service.bulkCreate(servicesData);
    }

    // Fetch updated invoice with services
    const updatedInvoice = await Invoice.findByPk(invoice.id, {
      include: [{ model: Service, as: 'services' }],
    });

    res.status(200).json(updatedInvoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.generateMonthlyInvoices = async (req, res) => {
  try {
    const { issue_date, due_date, billing_month, payment_date, status } = req.body;

    // Fetch monthly invoice templates from the 'monthly_invoices' table
    const monthlyInvoices = await MonthlyInvoice.findAll({
      include: [{ model: ServicePlanned, as: 'services_planned' }],
    });

    // Zoradenie šablón podľa id_company, aby boli faktúry rovnakej firmy ukladané postupne
    monthlyInvoices.sort((a, b) => a.id_residential_company - b.id_residential_company);

    const createdInvoices = [];

    for (const template of monthlyInvoices) {
      // Generate invoice_number based on your logic
      let invoiceYear = new Date(issue_date).getFullYear();

      // Fetch the last invoice number for the current company and year
      const lastInvoice = await Invoice.findOne({
        where: {
          id_company: template.id_company,
          issue_date: {
            [Op.between]: [`${invoiceYear}-01-01`, `${invoiceYear}-12-31`],
          },
        },
        order: [['invoice_number', 'DESC']],
      });

      // Extract and increment the number for the new invoice
      let newNumber = 1;
      if (lastInvoice) {
        const lastInvoiceNumber = lastInvoice.invoice_number;
        // Support both old format (00001/2026) and new format (20260001)
        if (lastInvoiceNumber.includes('/')) {
          // Old format: 00001/2026
          const lastNumberPart = lastInvoiceNumber.split('/')[0];
          newNumber = parseInt(lastNumberPart, 10) + 1;
        } else {
          // New format: 20260001 (first 4 digits are year, rest is number)
          const lastYear = lastInvoiceNumber.substring(0, 4);
          if (lastYear === invoiceYear.toString()) {
            const lastNumberPart = lastInvoiceNumber.substring(4);
            newNumber = parseInt(lastNumberPart, 10) + 1;
          }
          // If year doesn't match, start from 1
        }
      }

      // Format the new invoice number: YYYYNNNN (e.g., 20260001)
      const formattedNumber = newNumber.toString().padStart(4, '0');
      const invoice_number = `${invoiceYear}${formattedNumber}`;

      // Create the invoice
      const invoiceData = {
        invoice_name: template.invoice_name,
        id_company: template.id_company,
        id_residential_company: template.id_residential_company,
        issue_date,
        due_date,
        billing_month,
        payment_date,
        status,
        invoice_number,
        company_name: template.company_name,
        company_address: template.company_address,
        city: template.city,
        postal_code: template.postal_code,
        company_ico: template.company_ico,
        company_dic: template.company_dic,
        company_ic_dph: template.company_ic_dph,
        company_iban: template.company_iban,
        bank_connection: template.bank_connection,
        header1: template.header1,
        header2: template.header2,
        header3: template.header3,
        header4: template.header4,
        residential_company_name: template.residential_company_name,
        residential_company_address: template.residential_company_address,
        residential_city: template.residential_city,
        residential_postal_code: template.residential_postal_code,
        residential_company_ico: template.residential_company_ico,
        residential_company_dic: template.residential_company_dic,
        residential_company_ic_dph: template.residential_company_ic_dph,
        residential_company_iban: template.residential_company_iban,
        residential_bank_connection: template.residential_bank_connection,
        description_above_services: template.description_above_services,
        description_services: template.description_services,
      };

      const invoice = await Invoice.create(invoiceData);

      // Copy services from 'services_planned' to 'services'
      const servicesData = template.services_planned.map((service) => ({
        invoice_id: invoice.id,
        name: service.name,
        quantity: service.quantity,
        price: service.price,
      }));

      await Service.bulkCreate(servicesData);

      createdInvoices.push(invoice);
    }

    res.status(201).json({
      message: 'Mesačné faktúry úspešne vytvorené',
      invoices: createdInvoices,
    });
  } catch (error) {
    console.error('Error generating monthly invoices:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.generateMonthlyInvoicesForCompany = async (req, res) => {
  try {
    const { issue_date, due_date, billing_month, payment_date, status, id_company } = req.body;

    if (!id_company) {
      return res.status(400).json({ error: 'id_company is required' });
    }

    // Fetch monthly invoice templates for the selected company only
    const monthlyInvoices = await MonthlyInvoice.findAll({
      where: { id_company },
      include: [{ model: ServicePlanned, as: 'services_planned' }],
    });

    if (monthlyInvoices.length === 0) {
      return res.status(404).json({ 
        error: 'Žiadne mesačné faktúry pre túto spoločnosť' 
      });
    }

    // Zoradenie šablón podľa id_residential_company
    monthlyInvoices.sort((a, b) => a.id_residential_company - b.id_residential_company);

    const createdInvoices = [];
    let invoiceYear = new Date(issue_date).getFullYear();

    // Fetch the last invoice number for the company and year once
    const lastInvoice = await Invoice.findOne({
      where: {
        id_company: id_company,
        issue_date: {
          [Op.between]: [`${invoiceYear}-01-01`, `${invoiceYear}-12-31`],
        },
      },
      order: [['invoice_number', 'DESC']],
    });

    // Extract and increment the number for the new invoices
    let newNumber = 1;
    if (lastInvoice) {
      const lastInvoiceNumber = lastInvoice.invoice_number;
      // Support both old format (00001/2026) and new format (20260001)
      if (lastInvoiceNumber.includes('/')) {
        // Old format: 00001/2026
        const lastNumberPart = lastInvoiceNumber.split('/')[0];
        newNumber = parseInt(lastNumberPart, 10) + 1;
      } else {
        // New format: 20260001 (first 4 digits are year, rest is number)
        const lastYear = lastInvoiceNumber.substring(0, 4);
        if (lastYear === invoiceYear.toString()) {
          const lastNumberPart = lastInvoiceNumber.substring(4);
          newNumber = parseInt(lastNumberPart, 10) + 1;
        }
        // If year doesn't match, start from 1
      }
    }

    for (const template of monthlyInvoices) {
      // Format the invoice number: YYYYNNNN (e.g., 20260001)
      const formattedNumber = newNumber.toString().padStart(4, '0');
      const invoice_number = `${invoiceYear}${formattedNumber}`;

      // Create the invoice
      const invoiceData = {
        invoice_name: template.invoice_name,
        id_company: template.id_company,
        id_residential_company: template.id_residential_company,
        issue_date,
        due_date,
        billing_month,
        payment_date,
        status,
        invoice_number,
        company_name: template.company_name,
        company_address: template.company_address,
        city: template.city,
        postal_code: template.postal_code,
        company_ico: template.company_ico,
        company_dic: template.company_dic,
        company_ic_dph: template.company_ic_dph,
        company_iban: template.company_iban,
        bank_connection: template.bank_connection,
        payment_method: template.payment_method || 'Prevodom',
        header1: template.header1,
        header2: template.header2,
        header3: template.header3,
        header4: template.header4,
        residential_company_name: template.residential_company_name,
        residential_company_address: template.residential_company_address,
        residential_city: template.residential_city,
        residential_postal_code: template.residential_postal_code,
        residential_company_ico: template.residential_company_ico,
        residential_company_dic: template.residential_company_dic,
        residential_company_ic_dph: template.residential_company_ic_dph,
        residential_company_iban: template.residential_company_iban,
        residential_bank_connection: template.residential_bank_connection,
        description_above_services: template.description_above_services,
        description_services: template.description_services,
      };

      const invoice = await Invoice.create(invoiceData);

      // Copy services from 'services_planned' to 'services'
      const servicesData = template.services_planned.map((service) => ({
        invoice_id: invoice.id,
        name: service.name,
        quantity: service.quantity,
        price: service.price,
      }));

      await Service.bulkCreate(servicesData);

      createdInvoices.push(invoice);
      newNumber++; // Increment for next invoice
    }

    res.status(201).json({
      message: `Vytvorené ${createdInvoices.length} mesačné faktúry pre vybranú spoločnosť`,
      invoices: createdInvoices,
    });
  } catch (error) {
    console.error('Error generating monthly invoices for company:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.updateInvoicesFromTransactions = async (req, res) => {
  try {
    const transactions = req.body.transactions;
    
    if (!Array.isArray(transactions)) {
      return res.status(400).json({ error: "'transactions' must be an array" });
    }
    
    const updatedInvoices = [];
    const unlinkedTransactions = [];
    const wrongPriceTransactions = []; // Pre transakcie s nesúladom ceny

    for (const tx of transactions) {
      console.log(`Spracovávam transakciu: ${tx.vs}, IBAN: ${tx.creditorAcct}`);

      // Nájdeme firmu na základe IBAN-u (odstránime medzery)
      const foundCompany = await Company.findOne({
        where: Sequelize.where(
          Sequelize.fn('REPLACE', Sequelize.col('company_iban'), ' ', ''),
          tx.creditorAcct
        ),
      });
      if (!foundCompany) {
        console.error("Firma nenájdená pre IBAN:", tx.creditorAcct);
        unlinkedTransactions.push({ ...tx, reason: "Firma nenájdená" });
        continue;
      }

      // Overenie formátu VS (minimálne 4 znaky)
      if (!tx.vs || tx.vs.length < 4) {
        console.error("Neplatný formát VS:", tx.vs);
        unlinkedTransactions.push({ ...tx, reason: "Neplatný formát VS" });
        continue;
      }

      // Nájdeme faktúru pre danú firmu s daným invoice_number
      // Podporujeme oba formáty: starý (00001/2026) aj nový (20260001)
      let invoice = await Invoice.findOne({
        where: {
          id_company: foundCompany.id,
          invoice_number: tx.vs,
        },
        include: [{ model: Service, as: 'services' }],
      });

      // Ak faktúra nebola nájdená a VS je v starom formáte, skúsime previesť na nový formát
      if (!invoice && tx.vs.includes('/')) {
        const [numberPart, yearPart] = tx.vs.split('/');
        const newFormat = `${yearPart}${numberPart.padStart(4, '0')}`;
        invoice = await Invoice.findOne({
          where: {
            id_company: foundCompany.id,
            invoice_number: newFormat,
          },
          include: [{ model: Service, as: 'services' }],
        });
      }

      // Ak faktúra nebola nájdená a VS je v novom formáte, skúsime previesť na starý formát
      if (!invoice && !tx.vs.includes('/') && tx.vs.length >= 8) {
        const yearPart = tx.vs.substring(0, 4);
        const numberPart = tx.vs.substring(4);
        const oldFormat = `${numberPart.padStart(5, '0')}/${yearPart}`;
        invoice = await Invoice.findOne({
          where: {
            id_company: foundCompany.id,
            invoice_number: oldFormat,
          },
          include: [{ model: Service, as: 'services' }],
        });
      }

      if (!invoice) {
        console.error("Faktúra nenájdená:", tx.vs, "pre firmu:", foundCompany.company_name);
        unlinkedTransactions.push({ ...tx, reason: "Faktúra nenájdená" });
        continue;
      }

      // Ak je faktúra už zaplatená, preskočíme ju
      if (invoice.status === 'paid') {
        console.log(`Faktúra ${tx.vs} už bola zaplatená.`);
        continue;
      }

      // Prevedieme transakčnú sumu na číslo
      const transactionAmount = parseFloat(tx.amount) || 0;

      const computedSumRaw = invoice.services.reduce((acc, service) => {
        const price = parseFloat(service.price) || 0;
        const quantity = parseInt(service.quantity, 10) || 0;
        return acc + price * quantity;
      }, 0);

      const computedSum = computedSumRaw.toFixed(2);

      if (Math.abs(transactionAmount - computedSum) > 0.01) {
        console.error(
          `Faktúra ${tx.vs} má nesedúcu sumu: transakčná ${transactionAmount} vs. uložená ${computedSum}`
        );
        wrongPriceTransactions.push({ ...tx, computedSum, reason: "Nesúlad sumy", invoice_id: invoice.id });
        continue;
      }

      // Ak suma sedí, aktualizujeme faktúru
      invoice.status = 'paid';
      invoice.payment_date = tx.paymentDate;
      await invoice.save();
      updatedInvoices.push(invoice);
      console.log(`Faktúra ${tx.vs} bola úspešne aktualizovaná.`);
    }

    res.status(200).json({
      message: "Faktúry úspešne aktualizované.",
      updatedInvoices,
      unlinkedTransactions,
      wrongPriceTransactions,
    });
  } catch (error) {
    console.error("Error updating invoices from transactions:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.bulkUpdateStatus = async (req, res) => {
  try {
    const { invoiceIds, status, payment_date } = req.body;

    if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return res.status(400).json({ error: 'invoiceIds sú povinné a musia byť pole.' });
    }

    // Validácia statusu
    const validStatuses = ['created', 'sent', 'paid', 'expired'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Neplatný status.' });
    }

    // Príprava dát na aktualizáciu
    const updateData = { status };
    if (status === 'paid') {
      if (!payment_date) {
        return res.status(400).json({ error: 'payment_date je povinný pre status "paid".' });
      }
      updateData.payment_date = payment_date;
    } else {
      updateData.payment_date = null; // Reset payment_date pre iné statusy
    }

    // Aktualizácia faktúr
    await Invoice.update(updateData, {
      where: {
        id: {
          [Op.in]: invoiceIds,
        },
      },
    });

    res.status(200).json({ message: 'Faktúry úspešne aktualizované.' });
  } catch (error) {
    console.error('Error in bulkUpdateStatus:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

exports.bulkDeleteInvoices = async (req, res) => {
  try {
    const { invoiceIds } = req.body;

    if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return res.status(400).json({ error: 'invoiceIds sú povinné a musia byť pole.' });
    }

    await Invoice.destroy({
      where: {
        id: {
          [Op.in]: invoiceIds,
        },
      },
    });

    res.status(200).json({ message: 'Faktúry úspešne vymazané.' });
  } catch (error) {
    console.error('Error in bulkDeleteInvoices:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Vymazanie faktúry
exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Vymažeme faktúru (a pridružené služby vďaka onDelete: 'CASCADE')
    await invoice.destroy();

    res.status(200).json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Označenie faktúry ako zaplatené
exports.markInvoiceAsPaid = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const { payment_date } = req.body;

    const invoice = await Invoice.findByPk(invoiceId);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Aktualizácia statusu a dátumu zaplatenia
    invoice.status = 'paid';
    invoice.payment_date = payment_date;
    await invoice.save();

    res.status(200).json(invoice);
  } catch (error) {
    console.error('Error marking invoice as paid:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Označenie faktúry ako odoslané
exports.markInvoiceAsSent = async (req, res) => {
  try {
    const { invoiceId } = req.params;

    const invoice = await Invoice.findByPk(invoiceId);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Aktualizácia statusu na "sent"
    invoice.status = 'sent';
    await invoice.save();

    res.status(200).json(invoice);
  } catch (error) {
    console.error('Error marking invoice as sent:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Získanie štatistík faktúr pre dashboard
exports.getInvoiceStatistics = async (req, res) => {
  try {
    const { fromDate, toDate } = req.query;
    
    // Build where clause for date filtering
    const whereClause = {};
    if (fromDate && toDate) {
      whereClause.issue_date = {
        [Op.between]: [new Date(fromDate), new Date(toDate)]
      };
    }

    // Get all invoices with services for the date range
    const invoices = await Invoice.findAll({
      where: whereClause,
      include: [
        { 
          model: Service, 
          as: 'services',
          attributes: ['id', 'price', 'quantity'],
        }
      ],
    });

    // Calculate statistics
    let totalRevenue = 0; // Obrat (súčet zaplatených faktúr)
    let totalInvoicesCount = invoices.length; // Počet vystavených faktúr
    let unpaidInvoicesCount = 0; // Počet neuhradených faktúr

    invoices.forEach(invoice => {
      // Calculate total price for each invoice
      const invoiceTotal = (invoice.services || []).reduce((acc, service) => {
        const price = parseFloat(service.price) || 0;
        const quantity = parseInt(service.quantity, 10) || 0;
        return acc + price * quantity;
      }, 0);

      // Add to revenue if paid
      if (invoice.status === 'paid') {
        totalRevenue += invoiceTotal;
      }

      // Count unpaid invoices (not paid status)
      if (invoice.status !== 'paid') {
        unpaidInvoicesCount++;
      }
    });

    res.status(200).json({
      totalRevenue: totalRevenue.toFixed(2),
      totalInvoicesCount,
      unpaidInvoicesCount,
    });
  } catch (error) {
    console.error('Error fetching invoice statistics:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
