import * as Hapi from '@hapi/hapi';
import { getSequelizeInstance } from '../init-sequelize';
export const root_route: Hapi.ServerRoute = {
  method: 'GET',
  path: '/',
  handler: (request: Hapi.Request, h: Hapi.ResponseToolkit) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
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
export const health_check_route: Hapi.ServerRoute = {
  method: 'GET',
  path: '/_ah/health',
  handler: async (request, h) => {
    // sequelize.authenticate() is the recommended way of testing DB's reachability
    const seq = getSequelizeInstance();
    if (seq) {
      return seq
        .authenticate()
        .then(() => h.response({ status: 'ok' }).code(200))
        .catch(() => h.response({ status: 'unhealthy' }).code(500));
    } else {
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
