import { ClassType } from '../../../helpers';
import { Field, ObjectType } from 'type-graphql';
import { IClientMutationId } from './client_mutation_id.interface';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function withRelayMutationPayload<TInput extends ClassType<Record<string, any>>>(
  Base: TInput
) {
  @ObjectType({ isAbstract: true })
  class RelayMutationPayload extends Base implements IClientMutationId {
    @Field({ nullable: true })
    clientMutationId?: string; // passed in by client and retuurned in the payload. We use the Relay naming convention
  }
  return RelayMutationPayload;
}
