// models/ImportedTransaction.js
//
// Register už naimportovaných bankových transakcií (z XML výpisov camt.053).
// Slúži na to, aby sa pri opakovanom nahratí toho istého výpisu dal každý
// záznam identifikovať ako duplicita a znovu sa nezaložil.
//
// Kľúčom je `fingerprint` - buď NtryRef z banky, alebo hash z dátumu, sumy,
// IBAN-u a popisu (viď utils/transactionFingerprint.js).

module.exports = (sequelize, DataTypes) => {
  const ImportedTransaction = sequelize.define('ImportedTransaction', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    fingerprint: {
      type: DataTypes.STRING(128),
      allowNull: false,
      unique: true,
      comment: 'Jedinečný odtlačok transakcie - "ntry:<NtryRef>" alebo "fp:<sha1>"',
    },
    ntry_ref: {
      type: DataTypes.STRING(64),
      allowNull: true,
      comment: 'Pôvodný NtryRef z výpisu, ak ho výpis obsahoval',
    },
    source: {
      type: DataTypes.ENUM('vydavok', 'platba'),
      allowNull: false,
      comment: 'Z ktorého importu záznam pochádza',
    },
    booking_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    counterparty_iban: {
      type: DataTypes.STRING(64),
      allowNull: true,
    },
    counterparty_name: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reference: {
      type: DataTypes.STRING(64),
      allowNull: true,
      comment: 'Variabilný symbol (len pri importe platieb)',
    },
    id_expense: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'expenses', key: 'id' },
      // Ak sa výdavok zmaže, zmaže sa aj záznam v registri - vďaka tomu sa dá
      // omylom zmazaný výdavok znovu naimportovať z toho istého výpisu.
      onDelete: 'CASCADE',
    },
    id_invoice: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'invoices', key: 'id' },
      onDelete: 'SET NULL',
    },
  }, {
    tableName: 'imported_transactions',
    timestamps: true,
  });

  ImportedTransaction.associate = (models) => {
    ImportedTransaction.belongsTo(models.Expense, { foreignKey: 'id_expense', as: 'expense' });
    ImportedTransaction.belongsTo(models.Invoice, { foreignKey: 'id_invoice', as: 'invoice' });
  };

  return ImportedTransaction;
};
