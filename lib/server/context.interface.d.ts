import { ContainerInstance } from 'typedi';
import { Claims } from '@rumbleship/acl';
export interface Context {
    requestId: string;
    container: ContainerInstance;
    credentials: Claims;
}
