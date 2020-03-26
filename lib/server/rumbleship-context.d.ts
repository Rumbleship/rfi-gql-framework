import { ContainerInstance } from 'typedi';
import { RFIFactory } from '@rumbleship/service-factory-map';
import { Authorizer } from '@rumbleship/acl';
import { RumbleshipBeeline, HoneycombSpan } from '@rumbleship/o11y';
export interface RumbleshipContextOptionsPlain {
    config: object;
    id?: string;
    authorizer?: Authorizer;
    logger?: SpyglassLogger;
    container?: ContainerInstance;
    initial_trace_metadata?: object;
}
export interface Context {
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
    private static ActiveContexts;
    static addSequelizeServicesToContext: (c: RumbleshipContext) => RumbleshipContext;
    static initialize(serviceFactories: Map<string, RFIFactory<any>>, addSequelizeServicesToContext: (c: RumbleshipContext) => RumbleshipContext): void;
    static releaseAllContexts(): void;
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
export interface SpyglassLogger {
    addMetadata: (object: object) => void;
    log: (message: any, metadata?: object) => void;
    emerg: (message: any, metadata?: object) => void;
    alert: (message: any, metadata?: object) => void;
    crit: (message: any, metadata?: object) => void;
    error: (message: any, metadata?: object) => void;
    warn: (message: any, metadata?: object) => void;
    warning: (message: any, metadata?: object) => void;
    notice: (message: any, metadata?: object) => void;
    info: (message: any, metadata?: object) => void;
    debug: (message: any, metadata?: object) => void;
}
