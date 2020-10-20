import { RumbleshipContext } from '.';
import { Authorizer } from '@rumbleship/acl';
import { ContainerInstance } from 'typedi';
import { HoneycombSpan, RumbleshipBeeline } from '@rumbleship/o11y';
import { SpyglassLogger } from '@rumbleship/spyglass';
export declare class OnDemandRumbleshipContext implements RumbleshipContext {
    private marshalled_acl;
    isQueuedSubscription: boolean;
    private on_demand_context_id;
    private _wrappedContext?;
    private _authorizer?;
    constructor(marshalled_acl: string, isQueuedSubscription?: boolean);
    private getAuthorizer;
    private get wrappedContext();
    get authorizer(): Authorizer;
    get container(): ContainerInstance;
    get id(): string;
    get beeline(): RumbleshipBeeline;
    get logger(): SpyglassLogger;
    get trace(): HoneycombSpan | undefined;
    release(): Promise<void>;
    reset(): Promise<void>;
}
