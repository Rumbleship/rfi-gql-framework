"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rootNodeFrom = void 0;
/**
 *
 * @param { ExecutionResult } execution_result
 * @returns { string | undefined }
 *  If execution_result is for a single node, returns the `id` attribute of the root
 *   result, or the root node of result
 *     * { data: { workflow: { node: { id: "wf_12345" } } } } ==> "wf_12345"
 *     * { data: { order: { id: "o_a23bca"} } } => "o_a23bca"
 *  Otherwise (execution result has edges, or no data, etc ) `undefined`
 */
function rootNodeFrom(execution_result) {
    var _a;
    if (!execution_result.data) {
        return undefined;
    }
    const operation_name = Object.keys(execution_result.data)[0];
    const result = execution_result.data[operation_name];
    if (result.id) {
        return result.id;
    }
    if ((_a = result.node) === null || _a === void 0 ? void 0 : _a.id) {
        return result.node.id;
    }
    return undefined;
}
exports.rootNodeFrom = rootNodeFrom;
//# sourceMappingURL=node-id-from-execution-result.js.map