import { RumbleshipContext } from '.';
import { Authorizer } from '@rumbleship/acl';
export declare class OnDemandRumbleshipContext implements RumbleshipContext {
    private marshalled_acl;
    isQueuedSubscription: boolean;
    private _wrappedContext?;
    private _authorizer?;
    constructor(marshalled_acl: string, isQueuedSubscription?: boolean);
    private getAuthorizer;
    private get wrappedContext();
    get authorizer(): Authorizer;
    get container(): import("typedi").ContainerInstance;
    get id(): string;
    get beeline(): import("@rumbleship/o11y").RumbleshipBeeline;
    get logger(): import("./rumbleship-context.interface").SpyglassLogger;
    get trace(): import("@rumbleship/o11y").HoneycombSpan | undefined;
    release(): Promise<void>;
    reset(): Promise<void>;
}
