// models/Service.js

module.exports = (sequelize, DataTypes) => {
    const Service = sequelize.define('Service', {
        invoice_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'invoices', // Používame názov tabuľky v malých písmenách
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
        tableName: 'services',
    });

    // Definícia asociácií
    Service.associate = (models) => {
        Service.belongsTo(models.Invoice, { 
            foreignKey: 'invoice_id', 
            as: 'invoice' 
        });
    };

    return Service;
};
