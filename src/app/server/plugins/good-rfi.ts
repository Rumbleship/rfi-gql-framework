import * as Hapi from '@hapi/hapi';
import { SpyglassGoodReporter } from '@rumbleship/spyglass';

export const goodRfi = {
  name: 'good-rfi',
  async register(server: Hapi.Server, server_config: { logging: object }): Promise<void> {
    const options = {
      reporters: {
        // We don't use any of the options that SpyglassGoodReporter accepts -- just pass
        // an the empty object
        winston: [new SpyglassGoodReporter({ logging: server_config.logging })]
      },
      includes: {
        request: ['headers'],
        response: ['headers']
      },
      ops: false
      // ...server_config
    };

    return server.register([{ plugin: require('@hapi/good'), options }]);
  }
};
