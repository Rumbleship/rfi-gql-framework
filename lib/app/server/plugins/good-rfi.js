"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.goodRfi = void 0;
const spyglass_1 = require("@rumbleship/spyglass");
exports.goodRfi = {
    name: 'good-rfi',
    async register(server, server_config) {
        const options = {
            reporters: {
                // We don't use any of the options that SpyglassGoodReporter accepts -- just pass
                // an the empty object
                winston: [new spyglass_1.SpyglassGoodReporter({ logging: server_config.logging })]
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
//# sourceMappingURL=good-rfi.js.map