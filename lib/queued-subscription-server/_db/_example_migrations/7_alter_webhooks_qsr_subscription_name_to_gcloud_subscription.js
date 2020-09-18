"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports = module.exports = {
    async up(queryInterface) {
        return Promise.all([
            queryInterface.renameColumn('webhooks', 'qsr_subscription_name', 'gcloud_subscription')
        ]);
    },
    async down(queryInterface) {
        return Promise.all([
            queryInterface.renameColumn('webhooks', 'gcloud_subscription', 'qsr_subscription_name')
        ]);
    }
};
//# sourceMappingURL=7_alter_webhooks_qsr_subscription_name_to_gcloud_subscription.js.map