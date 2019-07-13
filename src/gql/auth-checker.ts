import { AuthChecker } from 'type-graphql';
import { PermissionsMatrix, Authorizer, Actions, Scopes } from '@rumbleship/acl';

export const RFIAuthChecker: AuthChecker<any, PermissionsMatrix | Scopes[] | Scopes> = (
  { root, args, context, info },
  permissionsOrScopeList
) => {
  const authorizer: Authorizer = context.authorizer;
  const { operation } = info.operation;
  if (!root) {
    // resolver level permissioning
    return authorizer.inScope(permissionsOrScopeList as Scopes[]);
  }
  // attribute level, through the resolver, permissioning

  return authorizer.can(operation as Actions, root, permissionsOrScopeList as PermissionsMatrix[]);
};
