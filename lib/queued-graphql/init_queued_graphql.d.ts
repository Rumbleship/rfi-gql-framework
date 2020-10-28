import { ISharedSchema } from '@rumbleship/config';
import { GraphQLSchema } from 'graphql';
import { RumbleshipContext } from '../app/rumbleship-context';
import { ClassType } from '../helpers';
export declare function initQueuedGraphql(config: ISharedSchema, schema: GraphQLSchema, observers: readonly ClassType<Record<string, any>>[]): void;
export declare function startQueuedGraphQl(ctx: RumbleshipContext): Promise<void>;
export declare function stopQueuedGraphQl(ctx: RumbleshipContext): Promise<void>;
