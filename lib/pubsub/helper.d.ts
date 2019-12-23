import { NodeNotification } from '../gql/node-notification';
import { ClassType } from './../helpers/classtype';
export declare function uniqueSubscriptionNamePart(): string;
interface GetModelFromStrOid {
    getOne(id: string): Promise<any>;
}
export interface RawPayload {
    data: {
        toString(): string;
    };
}
export declare function nodeNotficationFromPayload(rawPayload: any, resolver: GetModelFromStrOid, notificationClsType: ClassType<any>): Promise<NodeNotification<any>>;
export {};
