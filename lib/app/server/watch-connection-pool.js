"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachConnectionHooks = exports.traceConnection = void 0;
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
const o11y_1 = require("@rumbleship/o11y");
const uuid_1 = require("uuid");
const init_sequelize_1 = require("./init-sequelize");
async function traceConnection(action, sequelize, connection, config) {
    const beeline = o11y_1.RumbleshipBeeline.make(uuid_1.v4());
    const [connection_variables] = await sequelize.query("show status like '%onn%';");
    const { authorized, compressedSequenceId, connectionId, connectTimeout, serverCompatibilityFlags, threadId } = connection !== null && connection !== void 0 ? connection : {};
    const variable = {};
    for (const row of connection_variables) {
        variable[row.Variable_name] = row.Value;
    }
    const traceIt = () => {
        const span = beeline.startSpan({
            name: 'sequelize.connection',
            db: {
                connection: {
                    action,
                    authorized,
                    compressedSequenceId,
                    connectionId,
                    connectTimeout,
                    serverCompatibilityFlags,
                    threadId
                },
                variable
            }
        });
        o11y_1.addGaeVersionDataToTrace(() => beeline);
        beeline.finishSpan(span);
    };
    beeline.withTrace({ name: 'traceConnection' }, () => {
        traceIt();
    });
}
exports.traceConnection = traceConnection;
function attachConnectionHooks() {
    const sequelize = init_sequelize_1.getSequelizeInstance();
    sequelize === null || sequelize === void 0 ? void 0 : sequelize.addHook('beforeConnect', config => traceConnection('beforeConnect', sequelize, {}, config));
    sequelize === null || sequelize === void 0 ? void 0 : sequelize.addHook('afterConnect', (connection, config) => traceConnection('afterConnect', sequelize, connection, config));
    sequelize === null || sequelize === void 0 ? void 0 : sequelize.addHook('beforeDisconnect', connection => traceConnection('beforeDisconnect', sequelize, connection));
    sequelize === null || sequelize === void 0 ? void 0 : sequelize.addHook('afterDisconnect', connection => traceConnection('afterDisconnect', sequelize, connection));
}
exports.attachConnectionHooks = attachConnectionHooks;
//# sourceMappingURL=watch-connection-pool.js.map