// models/ServicePlanned.js
module.exports = (sequelize, DataTypes) => {
    const ServicePlanned = sequelize.define('ServicePlanned', {
        id_invoice_monthly_invoices: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'monthly_invoices', // Používame názov tabuľky v malých písmenách
                key: 'id',
            },
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE',
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1,
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00,
        },
    }, {
        tableName: 'service_planneds',
    });

    // Definícia asociácií
    ServicePlanned.associate = (models) => {
        ServicePlanned.belongsTo(models.MonthlyInvoice, {
            foreignKey: 'id_invoice_monthly_invoices',
            as: 'monthly_invoice'
        });
    };

    return ServicePlanned;
}
