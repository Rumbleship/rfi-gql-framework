export declare class MutationError extends Error {
    clientMutationId: string | null;
    constructor(originalError: Error | any, clientMutationId?: string | null, message?: string);
}
