import { NODE_CHANGE_NOTIFICATION } from '../../gql/relay/notification-of.enum';

export function triggerName(
  publisher_version: string = process.env.GAE_VERSION ?? 'date-version-branch',
  scope?: string,
  prefix?: string
): string {
  const elements = [NODE_CHANGE_NOTIFICATION];
  if (prefix) {
    elements.unshift(prefix);
  }
  if (scope) {
    elements.push(scope);
  }
  elements.push(publisher_version);
  return elements.join('_');
}
