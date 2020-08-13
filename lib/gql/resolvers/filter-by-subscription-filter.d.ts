import { SubscriptionWatchFilter } from '../relay/mixins/with-subscription-filter.mixin';
import { RawPayload } from './create-node-notification';
import { RumbleshipContext } from '../../app/rumbleship-context/rumbleship-context';
/**
 * THis is used as a standalone helper as it can be called from any Resolver - and is the
 * @important DEFAULT filter for any subscription defined with @RumbleshipSubscription
 *
 * It handles looking for notifications that a client has added a watch for as well as
 * ensures that any security is dealt with.
 *
 * Specialized resolvers that need to provide more functionality should follow this function
 *
 * @todo split this function into smaller pieces so the parts can be used by specialized resolvers
 *
 * @param param0
 */
export declare function filterBySubscriptionFilter({ payload: rawPayload, args, context }: {
    payload: RawPayload;
    args?: SubscriptionWatchFilter;
    context: RumbleshipContext;
}): Promise<boolean>;
export declare function filterById({ payload: rawPayload, args, context }: {
    payload: RawPayload;
    args?: {
        id?: string;
    };
    context: RumbleshipContext;
}): Promise<boolean>;
