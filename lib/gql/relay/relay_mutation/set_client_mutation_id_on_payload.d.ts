import { IClientMutationId } from './client_mutation_id.interface';
export declare function setClientMutationIdOnPayload<I extends IClientMutationId, P extends IClientMutationId>(input: I, mutationImpl: () => Promise<P>): Promise<P>;
