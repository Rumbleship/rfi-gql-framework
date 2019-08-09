import { ContainerInstance } from 'typedi';
import { Authorizer } from '@rumbleship/acl';

// Defining this here, for now, so I don't have to migrate all of Spyglass to TypeScript.
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
