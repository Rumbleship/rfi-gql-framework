import { ISharedSchema } from '@rumbleship/config';
import { GraphQLSchema } from 'graphql';
import { RumbleshipContext } from '../app/rumbleship-context';
import { ClassType } from '../helpers';
import { QueuedSubscriptionObserver } from './clients';
export declare function initQueuedGraphql(config: ISharedSchema, schema: GraphQLSchema, observers: ClassType<QueuedSubscriptionObserver>[]): void;
export declare function startQueuedGraphQl(ctx: RumbleshipContext): Promise<void>;
export declare function stopQueuedGraphQl(ctx: RumbleshipContext): Promise<void>;
