import { registerEnumType } from 'type-graphql';
export enum NotificationOf {
  LAST_KNOWN_STATE = 'LAST_KNOWN_STATE',
  CREATED = 'CREATED',
  UPDATED = 'UPDATED'
}

registerEnumType(NotificationOf, {
  name: 'NotificationOf',
  description: `For PubSub: The type of Notification. Note that BULK_CHANGE is sent when multiple 
  updates creates or destroys have been detected and the server can't be sure what they were EG if a
  complex bulk create or update was executed by the server,and the client should generally refresh all models 
  they are interested in.
  `
});

export const NODE_CHANGE_NOTIFICATION = 'NODE_CHANGE_NOTIFICATION';
