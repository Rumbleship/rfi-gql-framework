import { RumbleshipContext } from '.';
import { Authorizer } from '@rumbleship/acl';
import { ContainerInstance } from 'typedi';
import { HoneycombSpan, RumbleshipBeeline } from '@rumbleship/o11y';
import { SpyglassLogger } from '@rumbleship/spyglass';

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
  get authorizer(): Authorizer {
    return this.wrappedContext.authorizer;
  }
  get container(): ContainerInstance {
    return this.wrappedContext.container;
  }
  get id(): string {
    return this.wrappedContext.id;
  }
  get beeline(): RumbleshipBeeline {
    return this.wrappedContext.beeline;
  }
  get logger(): SpyglassLogger {
    return this.wrappedContext.logger;
  }
  get trace(): HoneycombSpan | undefined {
    return this.wrappedContext.trace;
  }
  async release(): Promise<void> {
    if (this._wrappedContext) {
      return this._wrappedContext.release();
    }
  }
  async reset(): Promise<void> {
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
