import { Oid } from '@rumbleship/oid';
import { NodeNotification } from '../gql/node-notification';
import { ClassType } from './../helpers/classtype';
export declare function uniqueSubscriptionNamePart(topicName: string): string;
interface OIDPayloadCreator {
    getOne(id: Oid): Promise<any>;
}
interface StrPayloadCreator {
    getOne(id: string): Promise<any>;
}
export interface RawPayload {
    data: {
        toString(): string;
    };
}
export declare function createPayloadUsingStr(rawPayload: RawPayload, resolver: StrPayloadCreator, notificationClsType: ClassType<any>): Promise<NodeNotification<any>>;
export declare function createPayloadUsingOid(rawPayload: RawPayload, resolver: OIDPayloadCreator, notificationClsType: ClassType<any>): Promise<NodeNotification<any>>;
export {};