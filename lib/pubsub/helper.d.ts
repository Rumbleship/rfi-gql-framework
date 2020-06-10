import { RumbleshipBeeline } from '@rumbleship/o11y';
import { Oid } from '@rumbleship/oid';
import { NodeNotification, Node } from '../gql';
import { ClassType } from './../helpers/classtype';
export interface RfiSubscriptionOptions {
    asService?: boolean;
    serviceName?: string;
}
export declare function uniqueSubscriptionNamePart(topicName: string, subscriptionOptions?: RfiSubscriptionOptions): string;
/**
 * @deprecated in favor of consolidated `PayloadCreator` interface
 */
interface OIDPayloadCreator {
    getOne(id: Oid): Promise<any>;
}
/**
 * @deprecated in favor of consolidated `PayloadCreator` interface
 */
interface StrPayloadCreator {
    getOne(id: string): Promise<any>;
}
interface Resolver {
    ctx: {
        beeline: RumbleshipBeeline;
    };
}
interface Service {
    getContext: () => {
        beeline: RumbleshipBeeline;
    };
}
interface GetOne {
    getOne(id: Oid | string): Promise<Node<any>>;
}
declare type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> & {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
}[Keys];
declare type ServiceOrResolver = GetOne & RequireAtLeastOne<Service & Resolver>;
export interface RawPayload {
    data: {
        toString(): string;
    };
}
export declare function createPayload(raw: RawPayload, invoker: ServiceOrResolver, NotificationType: ClassType<NodeNotification<any>>): Promise<NodeNotification<any>>;
/**
 * @deprecated in favor of combined `createPayload()`
 */
export declare function createPayloadUsingStr(rawPayload: RawPayload, resolver: StrPayloadCreator, notificationClsType: ClassType<any>): Promise<NodeNotification<any>>;
/**
 * @deprecated in favor of combined `createPayload()`
 */
export declare function createPayloadUsingOid(rawPayload: RawPayload, resolver: OIDPayloadCreator, notificationClsType: ClassType<any>): Promise<NodeNotification<any>>;
export {};
