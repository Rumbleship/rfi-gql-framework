"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports = module.exports = {
    async up(queryInterface) {
        return Promise.all([queryInterface.renameColumn('webhooks', 'system_id', 'owner_id')]);
    },
    async down(queryInterface) {
        return Promise.all([queryInterface.renameColumn('webhooks', 'owner_id', 'system_id')]);
    }
};
//# sourceMappingURL=4_alter_webhook_system_id_to_owner_id.js.map