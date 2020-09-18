"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setClientMutationIdOnPayload = void 0;
const mutation_error_1 = require("./mutation-error");
async function setClientMutationIdOnPayload(input, mutationImpl) {
    try {
        const payload = await mutationImpl();
        payload.clientMutationId = input.clientMutationId;
        return payload;
    }
    catch (error) {
        throw new mutation_error_1.MutationError(error, input.clientMutationId);
    }
}
exports.setClientMutationIdOnPayload = setClientMutationIdOnPayload;
//# sourceMappingURL=set_client_mutation_id_on_payload.js.map