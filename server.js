const express = require('express');
const path = require('path'); // ✅ Pridanie path na statické súbory
const sequelize = require('./config/database');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const cors = require('cors');
const { authenticateToken, authorizeRole } = require('./middleware/authMiddleware');
const companyRoutes = require('./routes/companyRoutes');
const monthlyInvoiceRoutes = require('./routes/monthlyInvoiceRoutes');
const models = require('./models'); // Import modelov
const invoiceRoutes = require('./routes/invoiceRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const expensesRoutes = require('./routes/expenses');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const User = require('./models').User;

dotenv.config();
const app = express();
app.use(express.json());
app.use(bodyParser.json());

// ✅ Povolenie CORS pre Heroku
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000'
}));

// ✅ Pridanie statických súborov z Reactu
app.use(express.static(path.join(__dirname, 'client', 'build')));

// ✅ API ROUTES
app.use('/api/auth', authRoutes);
app.use('/api', companyRoutes);
app.use('/api', monthlyInvoiceRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/expenses', expensesRoutes);

dotenv.config();
console.log('DATABASE_URL:', process.env.DATABASE_URL);

// ✅ Všetky ostatné požiadavky budú presmerované na React frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
});

async function createAdminIfNotExists() {
  const adminExists = await User.findOne({ where: { role: 'admin' } });

  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('dianka1997', 10);
    await User.create({
      username: 'dianka',
      password: hashedPassword,
      role: 'admin',
    });
    console.log('Admin account created: admin/admin123');
  }
}

// ✅ Pripojenie k databáze
sequelize.authenticate()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch(err => console.error('Unable to connect to PostgreSQL:', err));

// Na Heroku/produkcii sync bez alter (alter môže spadnúť). Lokálne môžeš mať alter: true.
const isProduction = process.env.NODE_ENV === 'production';
const syncOptions = isProduction ? {} : { alter: true };

sequelize.sync(syncOptions)
  .then(() => {
    console.log('Database synchronized');
    createAdminIfNotExists();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Error synchronizing database:', err);
    console.error(err.stack);
    process.exit(1);
  });
