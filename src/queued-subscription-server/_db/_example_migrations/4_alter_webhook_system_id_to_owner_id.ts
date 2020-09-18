import { QueryInterface } from 'sequelize';

exports = module.exports = {
  async up(queryInterface: QueryInterface) {
    return Promise.all([queryInterface.renameColumn('webhooks', 'system_id', 'owner_id')]);
  },
  async down(queryInterface: QueryInterface) {
    return Promise.all([queryInterface.renameColumn('webhooks', 'owner_id', 'system_id')]);
  }
};
