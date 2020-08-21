import { RumbleshipContext } from '.';
import { Authorizer } from '@rumbleship/acl';

export class OnDemandRumbleshipContext implements RumbleshipContext {
  private _wrappedContext?: RumbleshipContext;
  private _authorizer?: Authorizer = undefined;

  constructor(private marshalled_acl: string, public isQueuedSubscription = true) {}

  private getAuthorizer() {
    if (!this._authorizer) {
      this._authorizer = Authorizer.make(this.marshalled_acl);
    }
    return this._authorizer;
  }

  private get wrappedContext(): RumbleshipContext {
    if (!this._wrappedContext) {
      this._wrappedContext = RumbleshipContext.make(__filename, {
        authorizer: this.getAuthorizer()
      });
    }
    return this._wrappedContext;
  }
  get authorizer() {
    return this.wrappedContext.authorizer;
  }
  get container() {
    return this.wrappedContext.container;
  }
  get id() {
    return this.wrappedContext.id;
  }
  get beeline() {
    return this.wrappedContext.beeline;
  }
  get logger() {
    return this.wrappedContext.logger;
  }
  get trace() {
    return this.wrappedContext.trace;
  }
  async release() {
    if (this._wrappedContext) {
      return this._wrappedContext.release();
    }
  }
  async reset() {
    if (this._wrappedContext) {
      const toRelease = this._wrappedContext;
      this._wrappedContext = undefined;
      // reset the authorization as the context is long lived and we will
      // want to check the authorization in future
      this._authorizer = undefined;
      await toRelease.release();
    }
  }
}
