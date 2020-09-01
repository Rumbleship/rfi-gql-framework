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
  addMetadata: (object: Record<string, any>) => void;
  log: (message: any, metadata?: Record<string, any>) => void;
  emerg: (message: any, metadata?: Record<string, any>) => void;
  alert: (message: any, metadata?: Record<string, any>) => void;
  crit: (message: any, metadata?: Record<string, any>) => void;
  error: (message: any, metadata?: Record<string, any>) => void;
  warn: (message: any, metadata?: Record<string, any>) => void;
  warning: (message: any, metadata?: Record<string, any>) => void;
  notice: (message: any, metadata?: Record<string, any>) => void;
  info: (message: any, metadata?: Record<string, any>) => void;
  debug: (message: any, metadata?: Record<string, any>) => void;
}
