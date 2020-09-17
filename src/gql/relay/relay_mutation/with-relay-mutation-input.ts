import { ClassType } from '../../../helpers';
import { InputType, Field } from 'type-graphql';
import { IClientMutationId } from './client_mutation_id.interface';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function withRelayMutationInput<TInputBase extends ClassType<Record<string, any>>>(
  Base: TInputBase
) {
  @InputType({ isAbstract: true })
  class RelayMutationInput extends Base implements IClientMutationId {
    @Field({ nullable: true })
    clientMutationId?: string; // passed in by client and retuurned in the payload. We use the Relay naming convention
  }
  return RelayMutationInput;
}
