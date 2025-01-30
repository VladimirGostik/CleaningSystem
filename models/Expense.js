// models/Expense.js

module.exports = (sequelize, DataTypes) => {
    const Expense = sequelize.define('Expense', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      id_company: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Companies',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      price: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      deductibility: {
        type: DataTypes.FLOAT, // Percentá, napríklad 20 pre 20%
        allowNull: false,
        validate: {
          min: 0,
          max: 100,
        },
      },
      final_price: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('jednorazova', 'mesacna'),
        allowNull: false,
      },
      start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      end_date: {
        type: DataTypes.DATEONLY,
        allowNull: true, // Null pre jednorazové výdavky
      },
    }, {
      tableName: 'expenses',
      timestamps: true,
    });
  
    Expense.associate = (models) => {
      Expense.belongsTo(models.Company, { foreignKey: 'id_company' });
    };
  
    // Hook na výpočet final_price pred uložením
    Expense.beforeCreate((expense, options) => {
      expense.final_price = expense.price - (expense.price * (expense.deductibility / 100));
    });
  
    Expense.beforeUpdate((expense, options) => {
      expense.final_price = expense.price - (expense.price * (expense.deductibility / 100));
    });
  
    return Expense;
  };
  