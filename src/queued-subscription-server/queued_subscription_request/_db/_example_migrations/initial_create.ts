import 'reflect-metadata';
import * as Sequelize from 'sequelize';
import { DataType } from 'sequelize-typescript';

module.exports = {
  up: (queryInterface: Sequelize.QueryInterface): Promise<any> => {
    return queryInterface.createTable('queued_subscription_requests', {
      id: {
        type: DataType.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      authorized_requestor_id: {
        type: DataType.STRING,
        allowNull: false
      },
      marshalled_acl: {
        type: DataType.STRING,
        allowNull: false
      },
      gql_query_string: {
        type: DataType.TEXT,
        allowNull: false
      },
      query_attributes: {
        type: DataType.STRING,
        allowNull: true
      },
      operation_name: {
        type: DataType.STRING,
        allowNull: true
      },
      publish_to_topic_name: {
        type: DataType.STRING,
        allowNull: false
      },
      client_request_uuid: {
        type: DataType.STRING,
        allowNull: true
      },
      active: {
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });
  },
  down: (queryInterface: Sequelize.QueryInterface): Promise<any> => {
    return queryInterface.dropTable('queued_subscription_requests');
  }
};
