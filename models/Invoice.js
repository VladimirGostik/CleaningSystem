// models/Invoice.js

module.exports = (sequelize, DataTypes) => {
    const Invoice = sequelize.define('Invoice', {
        id_company: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Companies', // Názov tabuľky Companies
                key: 'id',
            },
        },
        id_residential_company: {
            type: DataTypes.INTEGER,
            references: {
                model: 'Companies', // Názov tabuľky Companies
                key: 'id',
            },
        },
        invoice_number: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        issue_date: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        due_date: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        // Dátum dodania (dátum zdaniteľného plnenia) - zobrazuje sa na PDF faktúre
        delivery_date: {
            type: DataTypes.DATEONLY,
            allowNull: true,
        },
        billing_month: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        payment_date: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('created', 'sent', 'expired', 'paid'),
            allowNull: false,
            defaultValue: 'created',
        },
        invoice_name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        company_name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        company_address: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        postal_code: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        city: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        company_ico: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        company_dic: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        company_ic_dph: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        company_iban: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        bank_connection: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        residential_company_name: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        residential_company_address: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        residential_postal_code: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        residential_city: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        residential_company_ico: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        residential_company_dic: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        residential_company_ic_dph: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        residential_company_iban: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        residential_bank_connection: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        header1: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        header2: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        header3: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        header4: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        description_above_services: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        description_services: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        id_monthly_invoice: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
                model: 'monthly_invoices',
                key: 'id',
            },
            onDelete: 'SET NULL',
        },
    }, {
        tableName: 'invoices', // Názov tabuľky
    });

    // Definícia asociácií
    Invoice.associate = (models) => {
        Invoice.hasMany(models.Service, { foreignKey: 'invoice_id', as: 'services' });
        Invoice.hasMany(models.Expense, { foreignKey: 'id_invoice', as: 'expenses' });
        Invoice.belongsTo(models.MonthlyInvoice, { foreignKey: 'id_monthly_invoice', as: 'monthlyInvoice' });
    };

    return Invoice;
};