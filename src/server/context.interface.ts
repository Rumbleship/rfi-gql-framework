import { ContainerInstance } from 'typedi';
import { Authorizer } from '@rumbleship/acl';
export interface Context {
  requestId: string;
  container: ContainerInstance;
  authorizer: Authorizer;
  logger: object; // Spyglass doesn't export a type, unfortunately
}
