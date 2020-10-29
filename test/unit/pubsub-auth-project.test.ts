import { IGcpAuthConfig } from '@rumbleship/config';
import { forcePublicProjectPubsub } from './../../src/helpers/pubsub-auth-project';

test.each([
  ['rfi-dev-private', 'rfi-dev-public'],
  ['rfi-staging-private', 'rfi-staging-public'],
  ['rfi-sandbox-private', 'rfi-sandbox-public'],
  ['rfi-production-private', 'rfi-production-public']
])(
  'Transform an auth object for private projectId (%s) to one for the associated public project (%s)',
  (specified_project_id, expected_project_id) => {
    const auth: IGcpAuthConfig = {
      projectId: specified_project_id
    };
    const pubsub = forcePublicProjectPubsub(auth);
    expect(pubsub).toBeTruthy();
    expect(pubsub.projectId).toBe(expected_project_id);
    // Ensure that the static config object that gets passed around remains unchanged
    expect(auth.projectId).toBe(specified_project_id);
  }
);
