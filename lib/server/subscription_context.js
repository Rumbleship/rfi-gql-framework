"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const acl_1 = require("@rumbleship/acl");
function initializeSubscriptionContext(connectionParams /** the params passed by the initial websoctect connection request */, _webSocket /* is ws.WebSocket, but right now is not used*/, context /** the context passed in by apollo */, injected) {
    const bearer_token = connectionParams.Authorization || connectionParams.authorization;
    if (bearer_token) {
        const authorizer = (() => {
            try {
                return new acl_1.Authorizer(bearer_token, injected.accessTokenSecret);
            }
            catch (error) {
                if (error instanceof acl_1.InvalidJWTError) {
                    throw new injected.authenticationErrorClass(error.message);
                }
                throw error;
            }
        })();
        try {
            authorizer.authenticate();
        }
        catch (e) {
            throw new injected.authenticationErrorClass(e.message);
        }
        const rumbleship_context = injected.rumbleshipContextFactory.make(__filename, {
            authorizer,
            config: injected.config,
            initial_trace_metadata: {
                subscription: true
            }
        });
        rumbleship_context.trace = rumbleship_context.beeline.startTrace({
            name: 'subscription'
        });
        context.rumbleship_context = rumbleship_context;
        return context;
    }
    throw new injected.authenticationErrorClass('Access Token Required');
}
exports.initializeSubscriptionContext = initializeSubscriptionContext;
function releaseSubscriptionContext(_webSocket, context) {
    const { rumbleship_context } = context;
    if (rumbleship_context) {
        setImmediate(() => rumbleship_context.release());
    }
}
exports.releaseSubscriptionContext = releaseSubscriptionContext;
//# sourceMappingURL=subscription_context.js.map