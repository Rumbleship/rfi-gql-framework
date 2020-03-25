import { ContainerInstance } from 'typedi';
import { RFIFactory } from '@rumbleship/service-factory-map';
import { Authorizer } from '@rumbleship/acl';
import { SpyglassLogger } from './context.interface';
import { RumbleshipBeeline, HoneycombSpan } from '@rumbleship/o11y';
export interface RumbleshipContextOptionsPlain {
    config: object;
    id?: string;
    authorizer?: Authorizer;
    logger?: SpyglassLogger;
    container?: ContainerInstance;
    initial_trace_metadata?: object;
}
interface Context {
    id: string;
    beeline: RumbleshipBeeline;
    trace?: HoneycombSpan;
    container: ContainerInstance;
    authorizer: Authorizer;
    logger: SpyglassLogger;
}
export declare class RumbleshipContext implements Context {
    id: string;
    container: ContainerInstance;
    logger: SpyglassLogger;
    authorizer: Authorizer;
    beeline: RumbleshipBeeline;
    trace: HoneycombSpan | undefined;
    private static initialized;
    private static _serviceFactories;
    static addSequelizeServicesToContext: (c: RumbleshipContext) => RumbleshipContext;
    static initialize(serviceFactories: Map<string, RFIFactory<any>>, addSequelizeServicesToContext: (c: RumbleshipContext) => RumbleshipContext): void;
    static make(filename: string, options: RumbleshipContextOptionsPlain): RumbleshipContext;
    constructor(id: string, container: ContainerInstance, logger: SpyglassLogger, authorizer: Authorizer, beeline: RumbleshipBeeline);
    release(): void;
}
export declare function withRumbleshipContext<T>(filename: string, options: RumbleshipContextOptionsPlain, fn: (ctx: RumbleshipContext) => T): Promise<T>;
/**
 * Provides a context that has an authorizer and credentials etc specifically for
 * THIS microservice so it can be used outside of the context of an Http/geaphql request
 * or GQL subscription.
 */
export declare function getRumbleshipContext(filename: string, config: object): RumbleshipContext;
export declare function releaseRumbleshipContext(context: Context): void;
export {};
