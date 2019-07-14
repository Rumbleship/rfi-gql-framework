import { AuthChecker } from 'type-graphql';
import { PermissionsMatrix, Authorizer, Actions, Scopes } from '@rumbleship/acl';
import { FieldNode, FragmentSpreadNode } from 'graphql';

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

  const selection = info.operation.selectionSet.selections[0] as FieldNode | FragmentSpreadNode;

  const action =
    operation === Actions.QUERY
      ? Actions.QUERY
      : selection.name && selection.name.value.match(/^update/)
      ? Actions.UPDATE
      : Actions.CREATE;

  return authorizer.can(action as Actions, root, permissionsOrScopeList as PermissionsMatrix[]);
};
