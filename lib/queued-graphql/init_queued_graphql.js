"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stopQueuedGraphQl = exports.startQueuedGraphQl = exports.initQueuedGraphql = void 0;
const typedi_1 = require("typedi");
const clients_1 = require("./clients");
const servers_1 = require("./servers");
function initQueuedGraphql(config, schema, observers) {
    // We set these objects to the container as they can be referenced in client apps
    // and we want to reduce the dependancies
    const queuedSubscriptionServer = new servers_1.QueuedSubscriptionServer(config, schema);
    typedi_1.Container.set('theQueuedSubscriptionServer', queuedSubscriptionServer);
    const queuedGqlRequestServer = new servers_1.QueuedGqlRequestServer(config, schema);
    typedi_1.Container.set('theQueuedGqlRequestServer', queuedGqlRequestServer);
    const queuedSubscriptionObservers = new clients_1.QueuedSubscriptionObserverManager(config, observers);
    typedi_1.Container.set('theQueuedSubscriptionObserverManager', queuedSubscriptionObservers);
}
exports.initQueuedGraphql = initQueuedGraphql;
async function startQueuedGraphQl(ctx) {
    // all the starts kick off there own promise chains...
    // we must await each of them to correctly manage the ctx... As this ctx is JUST for
    // startup and tracing
    const qsrSubscriptionServer = typedi_1.Container.get('theQueuedSubscriptionServer');
    await qsrSubscriptionServer.start(ctx);
    const qsrRequestServer = typedi_1.Container.get('theQueuedGqlRequestServer');
    await qsrRequestServer.start(ctx);
    const qsoManager = typedi_1.Container.get('theQueuedSubscriptionObserverManager');
    await qsoManager.init(ctx);
    await qsoManager.start(ctx);
}
exports.startQueuedGraphQl = startQueuedGraphQl;
async function stopQueuedGraphQl(ctx) {
    const qsrSubscriptionServer = typedi_1.Container.get('theQueuedSubscriptionServer');
    await qsrSubscriptionServer.stop(ctx);
    const qsrRequestServer = typedi_1.Container.get('theQueuedGqlRequestServer');
    await qsrRequestServer.stop(ctx);
    const qsoManager = typedi_1.Container.get('theQueuedSubscriptionObserverManager');
    await qsoManager.stop(ctx);
}
exports.stopQueuedGraphQl = stopQueuedGraphQl;
//# sourceMappingURL=init_queued_graphql.js.map