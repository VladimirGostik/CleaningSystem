const { Sequelize } = require('sequelize');
require('dotenv').config(); // Načítanie .env súboru

// Inicializácia Sequelize s PostgreSQL pomocou údajov z .env
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false // Dôležité pre Heroku Postgres!
    }
  }
});

module.exports = sequelize;
