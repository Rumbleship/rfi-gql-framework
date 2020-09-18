import 'reflect-metadata';
import { BOOLEAN, DATE, INTEGER, literal, QueryInterface, STRING, TEXT } from 'sequelize';

module.exports = {
  up: (queryInterface: QueryInterface): Promise<any> => {
    return queryInterface.createTable('webhooks', {
      id: {
        type: INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      system_id: {
        type: STRING,
        allowNull: true
      },
      subscription_url: {
        type: TEXT,
        allowNull: true
      },
      subscription_name: {
        type: STRING,
        allowNull: true
      },
      topic_name: {
        type: STRING,
        allowNull: true
      },
      active: {
        type: BOOLEAN,
        defaultValue: false
      },
      created_at: {
        type: DATE,
        allowNull: false,
        defaultValue: literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: DATE,
        allowNull: false
      },
      deleted_at: {
        type: DATE,
        allowNull: true
      }
    });
  },
  down: (queryInterface: QueryInterface): Promise<any> => {
    return queryInterface.dropTable('webhooks');
  }
};
