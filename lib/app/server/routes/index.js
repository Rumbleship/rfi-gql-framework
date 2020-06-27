"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.health_check_route = exports.root_route = void 0;
const init_sequelize_1 = require("../init-sequelize");
exports.root_route = {
    method: 'GET',
    path: '/',
    handler: (request, h) => {
        // tslint:disable-next-line no-implicit-dependencies
        const { name, version: pkg } = require('package.json');
        const { NODE_ENV: environment, CURRENT_VERSION_ID, GAE_VERSION } = process.env;
        return h
            .response({
            name,
            environment,
            version: CURRENT_VERSION_ID || GAE_VERSION || null,
            package: pkg
        })
            .code(200);
    },
    options: {
        auth: false,
        json: {
            space: 4
        }
    }
};
exports.health_check_route = {
    method: 'GET',
    path: '/_ah/health',
    handler: async (request, h) => {
        // sequelize.authenticate() is the recommended way of testing DB's reachability
        const seq = init_sequelize_1.getSequelizeInstance();
        if (seq) {
            return seq
                .authenticate()
                .then(() => h.response({ status: 'ok' }).code(200))
                .catch(() => h.response({ status: 'unhealthy' }).code(500));
        }
        else {
            return 'unhealthy';
        }
    },
    options: {
        auth: false,
        json: {
            space: 4
        }
    }
};
//# sourceMappingURL=index.js.map