"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const Sequelize = require("sequelize");
const sequelize_typescript_1 = require("sequelize-typescript");
module.exports = {
    up: (queryInterface) => {
        return queryInterface.createTable('queued_subscription_requests', {
            id: {
                type: sequelize_typescript_1.DataType.INTEGER,
                allowNull: false,
                primaryKey: true,
                autoIncrement: true
            },
            authorized_requestor_id: {
                type: sequelize_typescript_1.DataType.STRING,
                allowNull: false
            },
            marshalled_acl: {
                type: sequelize_typescript_1.DataType.STRING,
                allowNull: false
            },
            gql_query_string: {
                type: sequelize_typescript_1.DataType.TEXT,
                allowNull: false
            },
            query_attributes: {
                type: sequelize_typescript_1.DataType.STRING,
                allowNull: true
            },
            operation_name: {
                type: sequelize_typescript_1.DataType.STRING,
                allowNull: true
            },
            publish_to_topic_name: {
                type: sequelize_typescript_1.DataType.STRING,
                allowNull: false
            },
            client_request_uuid: {
                type: sequelize_typescript_1.DataType.STRING,
                allowNull: true
            },
            active: {
                type: sequelize_typescript_1.DataType.BOOLEAN,
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
    down: (queryInterface) => {
        return queryInterface.dropTable('queued_subscription_requests');
    }
};
//# sourceMappingURL=1_initial_create.js.map