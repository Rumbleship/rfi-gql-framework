import { logging } from '@rumbleship/spyglass';
import Container, { ContainerInstance } from 'typedi';
import { RFIFactory } from '@rumbleship/service-factory-map';
import { Authorizer, Scopes, createAuthHeader } from '@rumbleship/acl';
import { RumbleshipBeeline, HoneycombSpan } from '@rumbleship/o11y';
import uuid = require('uuid');

export interface RumbleshipContextOptionsPlain {
  config: object;
  id?: string;
  authorizer?: Authorizer;
  logger?: SpyglassLogger;
  container?: ContainerInstance;
  initial_trace_metadata?: object;
  marshalled_trace?: string;
}

class RumbleshipContextOptionsWithDefaults {
  private readonly _logger: SpyglassLogger;
  private readonly _container: ContainerInstance;
  private readonly _authorizer: Authorizer;
  private readonly _id: string;
  private readonly _initial_trace_metadata: object;
  private readonly _config: object;
  private readonly _marshalled_trace?: string;
  get authorizer() {
    return this._authorizer;
  }
  get container() {
    return this._container;
  }
  get id() {
    return this._id;
  }
  get initial_trace_metadata() {
    return this._initial_trace_metadata;
  }
  get logger() {
    return this._logger;
  }
  get config() {
    return this._config;
  }
  get marshalled_trace() {
    return this._marshalled_trace;
  }
  constructor(filename: string, options: RumbleshipContextOptionsPlain) {
    this._config = options.config;
    this._id = options.id ?? uuid.v4();
    this._marshalled_trace = options.marshalled_trace;
    this._initial_trace_metadata = options.initial_trace_metadata
      ? { name: 'app.rumbleship_context', ...options.initial_trace_metadata }
      : {
          name: 'app.rumbleship_context'
        };
    // remember that for some reason Spyglass takes the entire config object and pulls out its details
    // instead of just expecting what it needs
    this._logger = options.logger ?? logging.getLogger({ config: this.config, filename });
    this._authorizer =
      options.authorizer ??
      new Authorizer(
        createAuthHeader(
          {
            user: Reflect.get(this.config, 'serviceUser').id,
            roles: {},
            scopes: [Scopes.SYSADMIN]
          },
          Reflect.get(this.config, 'microservices').alpha.accessTokenSecret,
          { expiresIn: '5m' }
        ),
        Reflect.get(this.config, 'microservices').alpha.accessTokenSecret
      );
    this._authorizer.authenticate();
    this._container = options.container ?? Container.of(this.id);
  }
}

export interface Context {
  id: string;
  beeline: RumbleshipBeeline;
  trace?: HoneycombSpan;
  container: ContainerInstance;
  authorizer: Authorizer;
  logger: SpyglassLogger;
}

export class RumbleshipContext implements Context {
  // Shouldn't generally be needed, but is useful when handing one trace off to a different one.
  public trace: HoneycombSpan | undefined;
  private static initialized: boolean = false;
  private static _serviceFactories: Map<string, RFIFactory<any>>;
  private static ActiveContexts: Map<string, RumbleshipContext> = new Map();
  static addSequelizeServicesToContext: (c: RumbleshipContext) => RumbleshipContext;
  static initialize(
    serviceFactories: Map<string, RFIFactory<any>>,
    addSequelizeServicesToContext: (c: RumbleshipContext) => RumbleshipContext
  ) {
    this._serviceFactories = serviceFactories;
    this.addSequelizeServicesToContext = addSequelizeServicesToContext;
    this.initialized = true;
  }
  static releaseAllContexts() {
    for (const ctx of RumbleshipContext.ActiveContexts.values()) {
      ctx.release();
    }
  }
  static make(
    filename: string,
    options: RumbleshipContextOptionsPlain,
    factories: Map<string, RFIFactory<any>> = RumbleshipContext._serviceFactories
  ): RumbleshipContext {
    if (!this.initialized) {
      throw new Error('Must initialize the RumbleshipContext before making instances');
    }
    const {
      authorizer,
      container,
      id,
      logger,
      marshalled_trace
    } = new RumbleshipContextOptionsWithDefaults(filename, options);

    container.set('logger', logger);
    container.set('authorizer', authorizer);

    for (const [factory_name, factory] of factories.entries()) {
      container.set(factory_name, factory);
    }

    const beeline = container.get<typeof RumbleshipBeeline>('beelineFactory').make(id);
    const ctx = new RumbleshipContext(id, container, logger, authorizer, beeline, marshalled_trace);
    RumbleshipContext.ActiveContexts.set(ctx.id, ctx);
    logger.debug(`NEW SERVICE CONTEXT: ${ctx.id}`);
    if (marshalled_trace) {
      ctx.startDistributedTrace({ name: 'test' });
    }
    const withSequelize = this.addSequelizeServicesToContext(ctx) as RumbleshipContext;
    return withSequelize;
  }

  constructor(
    public id: string,
    public container: ContainerInstance,
    public logger: SpyglassLogger,
    public authorizer: Authorizer,
    public beeline: RumbleshipBeeline,
    private marshalled_trace?: string
  ) {}

  startDistributedTrace(span_data: object) {
    if (!this.marshalled_trace) {
      throw new Error('Cannot start a distributed trace without a marshalled trace');
    }
    const hydrated_trace = this.beeline.unmarshalTraceContext(this.marshalled_trace);
    return this.beeline.startTrace(
      span_data,
      hydrated_trace.traceId,
      hydrated_trace.parentSpanId,
      hydrated_trace.dataset
    );
  }

  release() {
    if (this.trace) {
      this.beeline.finishRumbleshipContextTrace();
    }
    this.logger.debug(`RELEASE SERVICE CONTEXT: ${this.id}`);
    this.container.reset();
  }
}
export function withRumbleshipContext<T>(
  filename: string,
  options: RumbleshipContextOptionsPlain,
  fn: (ctx: RumbleshipContext) => T
): Promise<T> {
  const { initial_trace_metadata } = new RumbleshipContextOptionsWithDefaults(filename, options);
  const ctx = Container.get<typeof RumbleshipContext>('RumbleshipContext').make(filename, options);
  ctx.trace = ctx.beeline.startTrace(
    {
      ...initial_trace_metadata
    },
    ctx.id
  );

  return new Promise((resolve, reject) => {
    const value = ctx.beeline.bindFunctionToTrace(() => fn(ctx));
    if (isPromise(value)) {
      // tslint:disable-next-line: no-floating-promises
      ((value as unknown) as Promise<T>)
        .then(resolve)
        .catch(reject)
        .finally(() => ctx.release());
    } else {
      ctx.release();
      resolve(value);
    }
  });
}

export function withLinkedRumbleshipContext<T>(
  parentSpan: HoneycombSpan,
  filename: string,
  options: RumbleshipContextOptionsPlain,
  fn: (ctx: RumbleshipContext) => T
): Promise<T> {
  const { initial_trace_metadata } = new RumbleshipContextOptionsWithDefaults(filename, options);
  const ctx = Container.get<typeof RumbleshipContext>('RumbleshipContext').make(filename, options);
  return ctx.beeline.runWithoutTrace(() => {
    ctx.trace = ctx.beeline.startTrace(
      {
        ...initial_trace_metadata
      },
      ctx.id
    );

    ctx.beeline.linkToSpan(parentSpan);

    return new Promise((resolve, reject) => {
      const value = ctx.beeline.bindFunctionToTrace(() => fn(ctx));
      if (isPromise(value)) {
        // tslint:disable-next-line: no-floating-promises
        ((value as unknown) as Promise<T>)
          .then(resolve)
          .catch(reject)
          .finally(() => ctx.release());
      } else {
        ctx.release();
        resolve(value);
      }
    });
  });
}

function isPromise(p: any) {
  return p && typeof p.then === 'function';
}

/**
 * Provides a context that has an authorizer and credentials etc specifically for
 * THIS microservice so it can be used outside of the context of an Http/geaphql request
 * or GQL subscription.
 */
export function getRumbleshipContext(filename: string, config: object): RumbleshipContext {
  // tslint:disable-next-line: no-console
  console.warn(`You probably DO NOT WANT to use this. 
  \tYou probably want to wrap your code with \`RumbleshipContext.withContext(cb: () => any)\`
  \tso you don't have to manage releasing the created context.
  \tIf you meant to use this, YOU MUST INVOKE \`context.release()\` otherwise memory leaks!`);
  const Factory = Container.get('RumbleshipContext') as typeof RumbleshipContext;
  return Factory.make(filename, { config });
}

export function releaseRumbleshipContext(context: Context) {
  context.beeline.finishRumbleshipContextTrace();
  context.logger.debug(`RELEASE SERVICE CONTEXT: ${context.id}`);
  context.container.reset();
}

export interface SpyglassLogger {
  addMetadata: (object: object) => void;
  log: (message: any, metadata?: object) => void;
  emerg: (message: any, metadata?: object) => void;
  alert: (message: any, metadata?: object) => void;
  crit: (message: any, metadata?: object) => void;
  error: (message: any, metadata?: object) => void;
  warn: (message: any, metadata?: object) => void;
  warning: (message: any, metadata?: object) => void;
  notice: (message: any, metadata?: object) => void;
  info: (message: any, metadata?: object) => void;
  debug: (message: any, metadata?: object) => void;
}
