import { INTEGER, QueryInterface } from 'sequelize';

exports = module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn('queued_subscription_requests', 'webhook_id', {
      type: INTEGER,
      references: {
        model: 'webhooks',
        key: 'id'
      }
    });
  },
  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn('queued_subscription_requests', 'webhook_id');
  }
};
