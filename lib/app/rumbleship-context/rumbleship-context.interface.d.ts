import { ContainerInstance } from 'typedi';
import { RumbleshipBeeline, HoneycombSpan } from '@rumbleship/o11y';
import { Authorizer } from '@rumbleship/acl';
export interface Context {
    id: string;
    beeline: RumbleshipBeeline;
    trace?: HoneycombSpan;
    container: ContainerInstance;
    authorizer: Authorizer;
    logger: SpyglassLogger;
}
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
