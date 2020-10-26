import { IGcpAuthConfig, IPubSubConfig } from '@rumbleship/config';
import { RumbleshipBeeline } from '@rumbleship/o11y';
import { RfiPubSub } from './../../../src/app/server/rfi-pub-sub-engine';

test.each([
  ['rfi-dev-private', 'rfi-dev-public'],
  ['rfi-staging-private', 'rfi-staging-public'],
  ['rfi-sandbox-private', 'rfi-sandbox-public'],
  ['rfi-production-private', 'rfi-production-public']
])(
  'Instantiating an RfiPubSub with a private projectId (%s) connects to the associated public project (%s)',
  (specified_project_id, expected_project_id) => {
    const auth: IGcpAuthConfig = {
      projectId: specified_project_id
    };
    const pubsub_config: IPubSubConfig = {
      topicPrefix: 'prefix',
      resetHostedSubscriptions: false,
      pollForUnstartedEvents: 60000,
      bootstrapStartDelayMs: 30000,
      alertOnStoppedIntervalMs: 10000
    };
    const pubsub = new RfiPubSub('version', 'banking', pubsub_config, auth, RumbleshipBeeline);
    expect(pubsub).toBeTruthy();
    expect(pubsub.pubSubClient.projectId).toBe(expected_project_id);
    // Ensure that the static config object that gets passed around remains unchanged
    expect(auth.projectId).toBe(specified_project_id);
  }
);
