// models/MonthlyInvoice.js

module.exports = (sequelize, DataTypes) => {
    const MonthlyInvoice = sequelize.define('MonthlyInvoice', {
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
    }, {
        tableName: 'monthly_invoices', // Ak používate iný názov tabuľky
    });

    // Definujte asociáciu v metóde associate
    MonthlyInvoice.associate = (models) => {
        MonthlyInvoice.hasMany(models.ServicePlanned, {
            foreignKey: 'id_invoice_monthly_invoices',
            as: 'services_planned'
        });
        MonthlyInvoice.hasMany(models.Invoice, {
            foreignKey: 'id_monthly_invoice',
            as: 'invoices'
        });
    };

    return MonthlyInvoice;
}