export interface RfiPubSubConfig {
  keyFilename: string;
  topicPrefix: string;
  resetHostedSubscriptions: boolean;
}
export const PubSubConfig = {
  keyFilename: {
    doc: 'filename',
    format: String,
    default: `/dev/null`,
    env: 'GOOGLE_APPLICATION_CREDENTIALS'
  },
  topicPrefix: {
    doc: 'Topic prefix - used in dev to separate out indivdual dev enviroment topics',
    format: String,
    default: process.env.NODE_ENV,
    env: 'GCP_PUBSUB_TOPIC_PREFIX'
  },
  resetHostedSubscriptions: {
    doc: 'Should all hosted subscriptions be reset on startup?',
    format: Boolean,
    default: false,
    env: 'GCP_PUBSUB_RESET_HOSTED_SUBSCRIPTIONS'
  }
};