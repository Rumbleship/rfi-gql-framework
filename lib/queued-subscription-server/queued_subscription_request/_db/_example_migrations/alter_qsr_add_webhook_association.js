"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
exports = module.exports = {
    up: async (queryInterface) => {
        await queryInterface.addColumn('queued_subscription_requests', 'webhook_id', {
            type: sequelize_1.INTEGER,
            references: {
                model: 'webhooks',
                key: 'id'
            }
        });
    },
    down: async (queryInterface) => {
        await queryInterface.removeColumn('queued_subscription_requests', 'webhook_id');
    }
};
//# sourceMappingURL=alter_qsr_add_webhook_association.js.map