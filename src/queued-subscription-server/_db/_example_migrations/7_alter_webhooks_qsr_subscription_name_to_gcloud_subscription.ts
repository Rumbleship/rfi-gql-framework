import { QueryInterface } from 'sequelize';

exports = module.exports = {
  async up(queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.renameColumn('webhooks', 'qsr_subscription_name', 'gcloud_subscription')
    ]);
  },
  async down(queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.renameColumn('webhooks', 'gcloud_subscription', 'qsr_subscription_name')
    ]);
  }
};
