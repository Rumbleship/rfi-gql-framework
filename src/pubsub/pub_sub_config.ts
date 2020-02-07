export interface RfiPubSubConfig {
  keyFilename: string;
  topicPrefex: string;
}
export const PubSubConfig = {
  keyFilename: {
    doc: 'filename',
    format: String,
    default: `/dev/null`,
    env: 'GCP_PUBSUB_KEY_FILE_NAME'
  },
  topicPrefix: {
    doc: 'Topic prefix - used in dev to separate out indivdual dev enviroment topics',
    format: String,
    default: process.env.NODE_ENV,
    env: 'GCP_PUBSUB_TOPIC_PREFIX'
  }
};
