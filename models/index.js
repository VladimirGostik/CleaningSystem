const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const db = {}; // Použi `db` namiesto `models` pre konzistentnosť

// Inicializácia modelov
db.User = require('./User')(sequelize, Sequelize.DataTypes);
db.Company = require('./Company')(sequelize, Sequelize.DataTypes);
db.Invoice = require('./Invoice')(sequelize, Sequelize.DataTypes);
db.Service = require('./Service')(sequelize, Sequelize.DataTypes);
db.MonthlyInvoice = require('./MonthlyInvoice')(sequelize, Sequelize.DataTypes);
db.ServicePlanned = require('./ServicePlanned')(sequelize, Sequelize.DataTypes);
db.Expense = require('./Expense')(sequelize, Sequelize.DataTypes);
db.ImportedTransaction = require('./ImportedTransaction')(sequelize, Sequelize.DataTypes);

// Pridaj Sequelize inštanciu do db objektu
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Inicializácia asociácií (ak modely majú `associate` metódu)
Object.values(db)
  .filter(model => typeof model.associate === 'function')
  .forEach(model => model.associate(db));

// Export databázového objektu so všetkými modelmi
module.exports = db;
