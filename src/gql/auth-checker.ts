import { AuthChecker } from 'type-graphql';
import { PermissionsMatrix, Authorizer, Actions, Scopes } from '@rumbleship/acl';

export const RFIAuthChecker: AuthChecker<any, PermissionsMatrix | Scopes[] | Scopes> = (
  { root, args, context, info },
  permissionsOrScopeList
) => {
  // Question #1 ("Do I exist?" has been answered; we have an authenticated Authorizer
  const authorizer: Authorizer = context.authorizer;
  // Answer Question #2: "Do I have the rights to ask this kind of question?"
  if (!root) {
    // resolver level permissioning
    return authorizer.inScope(permissionsOrScopeList as Scopes[]);
  }
  // Question #3 ("Can I ask this specific question") has been answered by DB/authorizer
  //  integration in the sequelize-base-service, so we can...
  // Answer Question #4: "Do I have the rights to read whatever I'm asking for?"
  return authorizer.can(Actions.QUERY, root, permissionsOrScopeList as PermissionsMatrix[]);
};
