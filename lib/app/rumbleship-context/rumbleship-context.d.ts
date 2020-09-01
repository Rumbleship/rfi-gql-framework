import { ContainerInstance } from 'typedi';
import { Authorizer } from '@rumbleship/acl';
import { RumbleshipBeeline, HoneycombSpan } from '@rumbleship/o11y';
import { RFIFactory } from '@rumbleship/service-factory-map';
import { SpyglassLogger, Context } from './rumbleship-context.interface';
import { ISharedSchema } from '@rumbleship/config';
export interface RumbleshipContextOptionsPlain {
    id?: string;
    authorizer?: Authorizer;
    logger?: SpyglassLogger;
    container?: ContainerInstance;
    initial_trace_metadata?: Record<string, any>;
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
    private static config;
    static addSequelizeServicesToContext: (c: RumbleshipContext) => RumbleshipContext;
    static initialize(serviceFactories: Map<string, RFIFactory<any>>, addSequelizeServicesToContext: (c: RumbleshipContext) => RumbleshipContext, config: ISharedSchema): void;
    static releaseAllContexts(): Promise<void>;
    static make(filename: string, options?: RumbleshipContextOptionsPlain, factories?: Map<string, RFIFactory<any>>): RumbleshipContext;
    static withRumbleshipContext<T>(filename: string, options: RumbleshipContextOptionsPlain, fn: (ctx: RumbleshipContext) => T): Promise<T>;
    constructor(id: string, container: ContainerInstance, logger: SpyglassLogger, authorizer: Authorizer, beeline: RumbleshipBeeline, initial_trace_metadata: Record<string, any>, marshalled_trace?: string, linked_span?: HoneycombSpan);
    release(): Promise<void>;
}
export declare const RumbleshipContextIdKey = "_@RumbleshipContextId";
export declare function setContextId<T extends Record<string, any>>(target: T, context_id: string): T & {
    [RumbleshipContextIdKey]: string;
};
export declare function getContextId(target: Record<string, any>): string | undefined;
export declare const RumbleshipActingUserKey = "_@RumbleshipActingUserKey";
export declare function setAuthorizedUser<T extends Record<string, any>>(target: T, authorizer: Authorizer): T & {
    [RumbleshipActingUserKey]: string;
};
export declare function getAuthorizedUser(target: Record<string, any>): string | undefined;
