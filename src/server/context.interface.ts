import { ContainerInstance } from 'typedi';

export interface RfiCredentials {
  exp: number;
  iat: number;
  user?: string;
  name?: string;
  scope?: string[];
  roles?: {
    admin: string[];
    pending: string[];
    user: string[];
  };
}
export interface Context {
  requestId: string;
  container: ContainerInstance;
  credentials: RfiCredentials;
}
