"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports = module.exports = {
    async up(queryInterface) {
        return Promise.all([
            queryInterface.renameColumn('webhooks', 'subscription_name', 'qsr_subscription_name')
        ]);
    },
    async down(queryInterface) {
        return Promise.all([
            queryInterface.renameColumn('webhooks', 'qsr_subscription_name', 'subsciption_name')
        ]);
    }
};
//# sourceMappingURL=5_alter_webhook_subscription_name_to_qsr_subscription_name.js.map