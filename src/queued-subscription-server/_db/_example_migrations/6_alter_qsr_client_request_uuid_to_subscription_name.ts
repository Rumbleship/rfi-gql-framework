import { QueryInterface } from 'sequelize';

exports = module.exports = {
  async up(queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.renameColumn(
        'queued_subscription_requests',
        'client_request_uuid',
        'subscription_name'
      ),
      queryInterface.renameColumn(
        'queued_subscription_requests',
        'authorized_requestor_id',
        'owner_id'
      )
    ]);
  },
  async down(queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.renameColumn(
        'queued_subscription_requests',
        'client_request_uuid',
        'subscription_name'
      ),
      queryInterface.renameColumn(
        'queued_subscription_requests',
        'owner_id',
        'authorized_requestor_id'
      )
    ]);
  }
};
