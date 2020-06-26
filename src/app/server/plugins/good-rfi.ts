import * as Hapi from '@hapi/hapi';
import { SpyglassGoodReporter } from '@rumbleship/spyglass';

export const goodRfi = {
  name: 'good-rfi',
  async register(server: Hapi.Server, options: object): Promise<void> {
    options = {
      reporters: {
        // We don't use any of the options that SpyglassGoodReporter accepts -- just pass
        // an the empty object
        winston: [new SpyglassGoodReporter(options)]
      },
      includes: {
        request: ['headers'],
        response: ['headers']
      },
      ops: false,
      ...options
    };

    return server.register([{ plugin: require('@hapi/good'), options }]);
  }
};
