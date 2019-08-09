import { ContainerInstance } from 'typedi';
import { Authorizer } from '@rumbleship/acl';
export interface SpyglassLogger {
    addMetadata: (object: object) => void;
    log: (any: any) => void;
    emerg: (any: any) => void;
    alert: (any: any) => void;
    crit: (any: any) => void;
    error: (any: any) => void;
    warn: (any: any) => void;
    warning: (any: any) => void;
    notice: (any: any) => void;
    info: (any: any) => void;
    debug: (any: any) => void;
}
export interface Context {
    requestId: string;
    container: ContainerInstance;
    authorizer: Authorizer;
    logger: SpyglassLogger;
}
