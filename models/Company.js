
module.exports = (sequelize, DataTypes) => {
  const Company = sequelize.define('Company', {
    company_name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255],
      },
    },
    company_address: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255],
      },
    },
    postal_code: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 20],
      },
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255],
      },
    },
    company_ico: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
      validate: {
        len: [0, 50],
      },
    },
    company_dic: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
      validate: {
        len: [0, 50],
      },
    },
    company_iban: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
      validate: {
        len: [0, 34],
      },
    },
    bank_connection: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
      validate: {
        len: [0, 10],
      },
    },
    type: {
      type: DataTypes.ENUM('company', 'residential-company'),
      allowNull: false,
    },
  });

  Company.associate = (models) => {
    Company.hasMany(models.Expense, { foreignKey: 'id_company', as: 'expenses' });
  };
  

  return Company;
};