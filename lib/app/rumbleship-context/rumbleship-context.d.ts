import { ContainerInstance } from 'typedi';
import { Authorizer } from '@rumbleship/acl';
import { RumbleshipBeeline, HoneycombSpan } from '@rumbleship/o11y';
import { RFIFactory } from '@rumbleship/service-factory-map';
import { SpyglassLogger, Context } from './rumbleship-context.interface';
import { ISharedSchema } from '@rumbleship/config';
export interface RumbleshipContextOptionsPlain {
    config: ISharedSchema;
    id?: string;
    authorizer?: Authorizer;
    logger?: SpyglassLogger;
    container?: ContainerInstance;
    initial_trace_metadata?: object;
    marshalled_trace?: string;
    linked_span?: HoneycombSpan;
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
    static releaseAllContexts(): Promise<void>;
    static make(filename: string, options: RumbleshipContextOptionsPlain, factories?: Map<string, RFIFactory<any>>): RumbleshipContext;
    constructor(id: string, container: ContainerInstance, logger: SpyglassLogger, authorizer: Authorizer, beeline: RumbleshipBeeline, initial_trace_metadata: object, marshalled_trace?: string, linked_span?: HoneycombSpan);
    release(): Promise<void>;
}
/** @deprecated ? */
export declare function withRumbleshipContext<T>(filename: string, options: RumbleshipContextOptionsPlain, fn: (ctx: RumbleshipContext) => T): Promise<T>;
export declare const RumbleshipContextIdKey = "_@RumbleshipContextId";
export declare function setContextId(target: object, context_id: string): object;
export declare function getContextId(target: object): string | undefined;
