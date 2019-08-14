import { ContainerInstance } from 'typedi';
import { Authorizer } from '@rumbleship/acl';

// Defining this here, for now, so I don't have to migrate all of Spyglass to TypeScript.
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
export interface Context {
  requestId: string;
  container: ContainerInstance;
  authorizer: Authorizer;
  logger: SpyglassLogger;
}
