const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  logging: false, // voliteľné, vypne logovanie SQL queries
});

module.exports = sequelize;


// const { Sequelize } = require('sequelize');
// require('dotenv').config(); // Načítanie .env súboru

// // Inicializácia Sequelize s PostgreSQL pomocou údajov z .env
// const sequelize = new Sequelize(
//   process.env.DB_NAME,
//   process.env.DB_USER,
//   process.env.DB_PASSWORD,
//   {
//     host: process.env.DB_HOST,
//     port: process.env.DB_PORT,
//     dialect: 'postgres',
//   }
// );

// module.exports = sequelize;