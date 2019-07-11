import { AuthChecker } from 'type-graphql';
import { PermissionsMatrix, Scopes } from '@rumbleship/acl';
export declare const RFIAuthChecker: AuthChecker<any, PermissionsMatrix | Scopes[] | Scopes>;
