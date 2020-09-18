"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const sequelize_1 = require("sequelize");
module.exports = {
    up: (queryInterface) => {
        return queryInterface.createTable('webhooks', {
            id: {
                type: sequelize_1.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true
            },
            system_id: {
                type: sequelize_1.STRING,
                allowNull: true
            },
            subscription_url: {
                type: sequelize_1.TEXT,
                allowNull: true
            },
            subscription_name: {
                type: sequelize_1.STRING,
                allowNull: true
            },
            topic_name: {
                type: sequelize_1.STRING,
                allowNull: true
            },
            active: {
                type: sequelize_1.BOOLEAN,
                defaultValue: false
            },
            created_at: {
                type: sequelize_1.DATE,
                allowNull: false,
                defaultValue: sequelize_1.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                type: sequelize_1.DATE,
                allowNull: false
            },
            deleted_at: {
                type: sequelize_1.DATE,
                allowNull: true
            }
        });
    },
    down: (queryInterface) => {
        return queryInterface.dropTable('webhooks');
    }
};
//# sourceMappingURL=2_add_webhook.js.map