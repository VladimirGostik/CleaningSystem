// controllers/invoiceController.js
const { Invoice, MonthlyInvoice, Service, ServicePlanned } = require('../models');
const { Op } = require('sequelize');

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
      include: [{ model: Service, as: 'services' }],
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
    console.log('Received invoice data:', invoiceData);

    const invoice = await Invoice.findByPk(req.params.id);

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Update invoice fields
    invoice.set(invoiceData);

    // Log changed fields
    console.log('Changed fields before save:', invoice.changed());

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

    const createdInvoices = [];

    for (const template of monthlyInvoices) {
      // Generate invoice_number based on your logic
      const invoiceYear = new Date(issue_date).getFullYear();

      if (billing_month === 12) {
        invoiceYear -= 1;
      }
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
        const lastNumberPart = lastInvoice.invoice_number.split('/')[0];
        newNumber = parseInt(lastNumberPart, 10) + 1;
      }

      // Format the new invoice number
      const formattedNumber = newNumber.toString().padStart(5, '0');
      const invoice_number = `${formattedNumber}/${invoiceYear}`;

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
