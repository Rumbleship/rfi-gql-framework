"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports = module.exports = {
    async up(queryInterface) {
        return Promise.all([
            queryInterface.renameColumn('queued_subscription_requests', 'client_request_uuid', 'subscription_name'),
            queryInterface.renameColumn('queued_subscription_requests', 'authorized_requestor_id', 'owner_id')
        ]);
    },
    async down(queryInterface) {
        return Promise.all([
            queryInterface.renameColumn('queued_subscription_requests', 'client_request_uuid', 'subscription_name'),
            queryInterface.renameColumn('queued_subscription_requests', 'owner_id', 'authorized_requestor_id')
        ]);
    }
};
//# sourceMappingURL=6_alter_qsr_client_request_uuid_to_subscription_name.js.map