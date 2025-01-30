const express = require('express');
const router = express.Router();
const { Company } = require('../models'); // Upravený import

// Create a new company
router.post('/companies', async (req, res) => {
  try {
    const company = await Company.create(req.body);
    res.status(201).json(company);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all companies of type 'company'
router.get('/companies', async (req, res) => {
  try {
    const companies = await Company.findAll({ where: { type: 'company' } });
    res.status(200).json(companies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single company by ID of type 'company'
router.get('/companies/:id', async (req, res) => {
  try {
    const company = await Company.findOne({ where: { id: req.params.id, type: 'company' } });
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    res.status(200).json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a company by ID of type 'company'
router.put('/companies/:id', async (req, res) => {
  try {
    const company = await Company.findOne({ where: { id: req.params.id, type: 'company' } });
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    await company.update(req.body);
    res.status(200).json(company);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a company by ID of type 'company'
router.delete('/companies/:id', async (req, res) => {
  try {
    const company = await Company.findOne({ where: { id: req.params.id, type: 'company' } });
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    await company.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new residential company
router.post('/residential-companies', async (req, res) => {
  try {
    const residentialCompany = await Company.create({ ...req.body, type: 'residential-company' });
    res.status(201).json(residentialCompany);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all residential companies
router.get('/residential-companies', async (req, res) => {
  try {
    const residentialCompanies = await Company.findAll({ where: { type: 'residential-company' } });
    res.status(200).json(residentialCompanies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single residential company by ID
router.get('/residential-companies/:id', async (req, res) => {
  try {
    const residentialCompany = await Company.findOne({ where: { id: req.params.id, type: 'residential-company' } });
    if (!residentialCompany) {
      return res.status(404).json({ error: 'Residential company not found' });
    }
    res.status(200).json(residentialCompany);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a residential company by ID
router.put('/residential-companies/:id', async (req, res) => {
  try {
    const residentialCompany = await Company.findOne({ where: { id: req.params.id, type: 'residential-company' } });
    if (!residentialCompany) {
      return res.status(404).json({ error: 'Residential company not found' });
    }
    await residentialCompany.update(req.body);
    res.status(200).json(residentialCompany);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a residential company by ID
router.delete('/residential-companies/:id', async (req, res) => {
  try {
    const residentialCompany = await Company.findOne({ where: { id: req.params.id, type: 'residential-company' } });
    if (!residentialCompany) {
      return res.status(404).json({ error: 'Residential company not found' });
    }
    await residentialCompany.destroy();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
