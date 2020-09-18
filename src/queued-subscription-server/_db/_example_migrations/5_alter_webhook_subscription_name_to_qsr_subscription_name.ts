import { QueryInterface } from 'sequelize';

exports = module.exports = {
  async up(queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.renameColumn('webhooks', 'subscription_name', 'qsr_subscription_name')
    ]);
  },
  async down(queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.renameColumn('webhooks', 'qsr_subscription_name', 'subsciption_name')
    ]);
  }
};
