import { IClientMutationId } from './client_mutation_id.interface';
import { MutationError } from './mutation-error';

export async function setClientMutationIdOnPayload<
  I extends IClientMutationId,
  P extends IClientMutationId
>(input: I, mutationImpl: () => Promise<P>): Promise<P> {
  try {
    const payload = await mutationImpl();
    payload.clientMutationId = input.clientMutationId;
    return payload;
  } catch (error) {
    throw new MutationError(error, input.clientMutationId);
  }
}
