// controllers/serviceController.js
const { Service } = require('../models');

// Získanie všetkých služieb pre konkrétnu faktúru
exports.getServicesByInvoiceId = async (req, res) => {
  try {
    const services = await Service.findAll({
      where: { invoice_id: req.params.invoiceId },
    });
    res.status(200).json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Pridanie novej služby k faktúre
exports.addServiceToInvoice = async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const serviceData = { ...req.body, invoice_id: invoiceId };

    const service = await Service.create(serviceData);

    res.status(201).json(service);
  } catch (error) {
    console.error('Error adding service:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Aktualizácia služby
exports.updateService = async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    await service.update(req.body);

    res.status(200).json(service);
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Vymazanie služby
exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findByPk(req.params.id);

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    await service.destroy();

    res.status(200).json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
