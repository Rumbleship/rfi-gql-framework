import { IGcpAuthConfig } from '@rumbleship/config';

/**
 *
 * @param auth
 * @returns A clone of the passed in auth object that replaces `-private` with `-public`
 * @used for forcing all services to talk to the GcpPubSub instance hosted in the "public"
 * project for their environment (e.g. both Banking and Orders talk to `rfi-{env}-public`)
 */
export function forcePublicProjectPubsub(auth: IGcpAuthConfig): IGcpAuthConfig {
  const cloned_auth = { ...auth };
  if (auth.projectId) {
    cloned_auth.projectId = auth.projectId.replace('private', 'public');
  }
  return cloned_auth;
}
