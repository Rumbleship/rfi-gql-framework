import { hostname } from 'os';
import { RfiSubscriptionOptions } from './rfi-pub-sub-engine.interface';

export function uniqueSubscriptionNamePart(
  topicName: string,
  subscriptionOptions?: RfiSubscriptionOptions
): string {
  if (subscriptionOptions && subscriptionOptions.asService) {
    return `${topicName}-${subscriptionOptions.serviceName ?? 'any'}-ServiceSubscription`;
  } else {
    return `${topicName}-${hostname()}`;
  }
}
