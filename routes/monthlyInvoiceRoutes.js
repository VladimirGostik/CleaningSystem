const express = require('express');
const router = express.Router();
const { MonthlyInvoice, ServicePlanned } = require('../models'); // Správny import

// Create Monthly Invoice with Services
router.post('/monthly-invoices', async (req, res) => {
  try {
    const { invoiceData, servicesData } = req.body;
    const monthlyInvoice = await MonthlyInvoice.create(invoiceData);
    
    if (servicesData && servicesData.length > 0) {
      const services = servicesData.map(service => ({
        ...service,
        id_invoice_monthly_invoices: monthlyInvoice.id,
      }));
      await ServicePlanned.bulkCreate(services);
    }

    res.status(201).json({ message: 'Monthly invoice created successfully', monthlyInvoice });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all Monthly Invoices with Services
router.get('/monthly-invoices', async (req, res) => {
  try {
    const monthlyInvoices = await MonthlyInvoice.findAll({
      include: {
        model: ServicePlanned,
        as: 'services_planned',
        attributes: ['id', 'name', 'price', 'quantity', 'id_invoice_monthly_invoices'],
        separate: true, // This prevents N+1 by using a separate query with IN clause
      },
      order: [['id', 'DESC']], // Order by id
    });
    res.status(200).json(monthlyInvoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Monthly Invoice by ID with Services
router.get('/monthly-invoices/:id', async (req, res) => {
    try {
      const monthlyInvoice = await MonthlyInvoice.findOne({
        where: { id: req.params.id },
        include: {
          model: ServicePlanned,
          as: 'services_planned',
        },
      });
  
      if (!monthlyInvoice) {
        return res.status(404).json({ error: 'Monthly invoice not found' });
      }
  
      // Konvertujte price a quantity na čísla
      const invoiceData = monthlyInvoice.toJSON();
      if (invoiceData.services_planned) {
        invoiceData.services_planned = invoiceData.services_planned.map(service => ({
          ...service,
          price: parseFloat(service.price),
          quantity: parseInt(service.quantity, 10),
        }));
      }
  
      res.status(200).json(invoiceData);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

// Update Monthly Invoice
router.put('/monthly-invoices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { invoiceData, servicesData } = req.body;

    // Nájdite faktúru podľa ID
    const invoice = await MonthlyInvoice.findByPk(id);
    if (!invoice) {
      return res.status(404).json({ message: 'Faktúra nenájdená' });
    }

    // Aktualizujte dáta faktúry
    await invoice.update(invoiceData);

    // Aktualizujte služby
    if (servicesData) {
      // Najprv odstráňte existujúce služby
      await ServicePlanned.destroy({ where: { id_invoice_monthly_invoices: id } });

      // Potom pridajte nové služby
      const servicesToCreate = servicesData.map(service => ({
        ...service,
        id_invoice_monthly_invoices: id,
      }));
      await ServicePlanned.bulkCreate(servicesToCreate);
    }

    // Nájdite aktualizovanú faktúru vrátane služieb
    const updatedInvoice = await MonthlyInvoice.findByPk(id, {
      include: [{ model: ServicePlanned, as: 'services_planned' }],
    });

    res.json({
      message: 'Faktúra úspešne aktualizovaná',
      monthlyInvoice: updatedInvoice,
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ message: 'Chyba pri aktualizácii faktúry', error: error.message });
  }
});

// Delete Monthly Invoice
router.delete('/monthly-invoices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const monthlyInvoice = await MonthlyInvoice.findByPk(id);
    if (!monthlyInvoice) {
      return res.status(404).json({ error: 'Monthly invoice not found' });
    }

    await ServicePlanned.destroy({ where: { id_invoice_monthly_invoices: monthlyInvoice.id } });
    await monthlyInvoice.destroy();

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
