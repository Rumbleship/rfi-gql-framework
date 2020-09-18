import { QueryInterface } from 'sequelize';

exports = module.exports = {
  async up(queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.renameColumn(
        'queued_subscription_request',
        'client_request_uuid',
        'subscription_name'
      ),
      queryInterface.renameColumn(
        'queued_subscription_request',
        'authorized_requestor_id',
        'owner_id'
      )
    ]);
  },
  async down(queryInterface: QueryInterface) {
    return Promise.all([
      queryInterface.renameColumn(
        'queued_subscription_request',
        'client_request_uuid',
        'subscription_name'
      ),
      queryInterface.renameColumn(
        'queued_subscription_request',
        'owner_id',
        'authorized_requestor_id'
      )
    ]);
  }
};
