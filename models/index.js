// models/index.js
const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const models = {};

// Inicializácia modelov
models.Company = require('./Company')(sequelize, Sequelize.DataTypes);
models.User = require('./User')(sequelize, Sequelize.DataTypes);
models.Invoice = require('./Invoice')(sequelize, Sequelize.DataTypes);
models.Service = require('./Service')(sequelize, Sequelize.DataTypes);
models.MonthlyInvoice = require('./MonthlyInvoice')(sequelize, Sequelize.DataTypes);
models.ServicePlanned = require('./ServicePlanned')(sequelize, Sequelize.DataTypes);
models.Expense = require('./Expense')(sequelize, Sequelize.DataTypes);
// Pridajte ďalšie modely tu, ak sú

// Inicializácia asociácií
Object.values(models)
  .filter(model => typeof model.associate === 'function')
  .forEach(model => model.associate(models));

module.exports = models;
