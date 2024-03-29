import { Container, ContainerInstance } from 'typedi';
import uuid = require('uuid');
import { Authorizer, Scopes } from '@rumbleship/acl';
import { RumbleshipBeeline, HoneycombSpan } from '@rumbleship/o11y';
import { RFIFactory } from '@rumbleship/service-factory-map';
import { logging } from '@rumbleship/spyglass';
import { SpyglassLogger, Context } from './rumbleship-context.interface';
import { ISharedSchema } from '@rumbleship/config';

export interface RumbleshipContextOptionsPlain {
  id?: string;
  authorizer?: Authorizer;
  logger?: SpyglassLogger;
  container?: ContainerInstance;
  initial_trace_metadata?: Record<string, any>;
  marshalled_trace?: string;
  linked_span?: HoneycombSpan;
}

class RumbleshipContextOptionsWithDefaults {
  private readonly _logger: SpyglassLogger;
  private readonly _container: ContainerInstance;
  private readonly _authorizer: Authorizer;
  private readonly _id: string;
  private readonly _initial_trace_metadata: Record<string, any>;
  private readonly _marshalled_trace?: string;
  private readonly _linked_span?: HoneycombSpan;
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
  get marshalled_trace() {
    return this._marshalled_trace;
  }
  get linked_span() {
    return this._linked_span;
  }
  constructor(filename: string, options: RumbleshipContextOptionsPlain, config: ISharedSchema) {
    this._id = options.id ?? uuid.v4();
    this._marshalled_trace = options.marshalled_trace;
    this._linked_span = options.linked_span;
    this._initial_trace_metadata = options.initial_trace_metadata
      ? { name: 'app.rumbleship_context', ...options.initial_trace_metadata }
      : {
          name: 'app.rumbleship_context'
        };
    // remember that for some reason Spyglass takes the entire config object and pulls out its details
    // instead of just expecting what it needs
    this._logger = options.logger ?? logging.getLogger(config.Logging, { filename });
    this._authorizer =
      options.authorizer ??
      Authorizer.make(
        Authorizer.createAuthHeader(
          {
            user: config.ServiceUser.id,
            roles: {},
            scopes: [Scopes.SYSADMIN]
          },
          { expiresIn: '5m' }
        ),
        true
      );
    this._authorizer.authenticate();
    this._container = options.container ?? Container.of(this.id);
  }
}

export class RumbleshipContext implements Context {
  // Shouldn't generally be needed, but is useful when handing one trace off to a different one.
  public trace: HoneycombSpan | undefined;
  private static initialized = false;
  private static _serviceFactories: Map<string, RFIFactory<any>>;
  private static ActiveContexts: Map<string, RumbleshipContext> = new Map();
  private static config: ISharedSchema;
  static addSequelizeServicesToContext: (c: RumbleshipContext) => RumbleshipContext;
  static initialize(
    serviceFactories: Map<string, RFIFactory<any>>,
    addSequelizeServicesToContext: (c: RumbleshipContext) => RumbleshipContext,
    config: ISharedSchema
  ): void {
    this._serviceFactories = serviceFactories;
    this.addSequelizeServicesToContext = addSequelizeServicesToContext;
    this.config = config;
    this.initialized = true;
  }
  static async releaseAllContexts(): Promise<void> {
    for (const ctx of RumbleshipContext.ActiveContexts.values()) {
      setImmediate(() => ctx.release());
    }
  }
  static make(
    filename: string,
    options: RumbleshipContextOptionsPlain = {},
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
      initial_trace_metadata,
      marshalled_trace,
      linked_span
    } = new RumbleshipContextOptionsWithDefaults(filename, options, this.config);

    container.set('logger', logger);
    container.set('authorizer', authorizer);

    for (const [factory_name, factory] of factories.entries()) {
      container.set(factory_name, factory);
    }

    const beeline = container.get<typeof RumbleshipBeeline>('beelineFactory').make(id);
    const ctx = new RumbleshipContext(
      id,
      container,
      logger,
      authorizer,
      beeline,
      initial_trace_metadata,
      marshalled_trace,
      linked_span
    );
    RumbleshipContext.ActiveContexts.set(ctx.id, ctx);
    logger.debug(`NEW SERVICE CONTEXT: ${ctx.id}`);
    const withSequelize = this.addSequelizeServicesToContext(ctx) as RumbleshipContext;
    return withSequelize;
  }

  static withRumbleshipContext<T>(
    filename: string,
    options: RumbleshipContextOptionsPlain,
    fn: (ctx: RumbleshipContext) => T
  ): Promise<T> {
    const { initial_trace_metadata } = new RumbleshipContextOptionsWithDefaults(
      filename,
      options,
      this.config
    );
    const ctx = Container.get<typeof RumbleshipContext>('RumbleshipContext').make(
      filename,
      options
    );
    ctx.trace = ctx.beeline.startTrace(
      {
        ...initial_trace_metadata
      },
      ctx.id
    );

    return new Promise((resolve, reject) => {
      const value = ctx.beeline.bindFunctionToTrace(() => fn(ctx))();
      if (isPromise(value)) {
        // tslint:disable-next-line: no-floating-promises
        ((value as unknown) as Promise<T>)
          .then(resolve)
          .catch(reject)
          .finally(() => setImmediate(() => ctx.release()));
      } else {
        setImmediate(() => ctx.release());
        resolve(value);
      }
    });
  }

  constructor(
    public id: string,
    public container: ContainerInstance,
    public logger: SpyglassLogger,
    public authorizer: Authorizer,
    public beeline: RumbleshipBeeline,
    initial_trace_metadata: Record<string, any>,
    marshalled_trace?: string,
    linked_span?: HoneycombSpan
  ) {
    const hydrated_trace = this.beeline.unmarshalTraceContext(marshalled_trace) as HoneycombSpan;
    this.trace = this.beeline.startTrace(
      { name: 'rumbleship_context', ...initial_trace_metadata },
      hydrated_trace.traceId,
      hydrated_trace.parentSpanId,
      hydrated_trace.dataset
    );
    this.beeline.addTraceContext(initial_trace_metadata);
    if (linked_span) {
      this.beeline.linkToSpan(linked_span);
    }
  }

  makeChild(filename: string): RumbleshipContext {
    return RumbleshipContext.make(filename, {
      marshalled_trace: this.beeline.marshalTraceContext(this.beeline.getTraceContext())
    });
  }

  async release(): Promise<void> {
    // interface TextRow {
    //   Variable_name: string;
    //   Value: string;
    // }
    try {
      // const queries = [
      //   "SHOW GLOBAL STATUS LIKE 'com_stmt%';",
      //   "SHOW GLOBAL STATUS LIKE 'prepared_stmt_count';",
      //   "SHOW GLOBAL VARIABLES LIKE 'max_prepared_stmt_count';"
      // ];
      // const db_vars_honeycomb = {};
      // for (const query of queries) {
      //   const [db_variables]: TextRow[][] = ((await getSequelizeInstance()?.query(query)) ?? [
      //     []
      //   ]) as TextRow[][];
      //   for (const text_row of db_variables) {
      //     const { Variable_name, Value } = text_row;
      //     Reflect.set(db_vars_honeycomb, `db.variable.${Variable_name}`, Number(Value));
      //   }
      // }
      // this.beeline.addContext(db_vars_honeycomb);
      if (this.trace) {
        this.beeline.finishTrace(this.trace);
      }
    } catch (error) {
      this.logger.error(error);
    } finally {
      this.logger.debug(`RELEASE SERVICE CONTEXT: ${this.id}`);
      this.container.reset();
    }
  }
}

function isPromise(p: any) {
  return p && typeof p.then === 'function';
}

export const RumbleshipContextIdKey = '_@RumbleshipContextId';
export function setContextId<T extends Record<string, any>>(
  target: T,
  context_id: string
): T & { [RumbleshipContextIdKey]: string } {
  Reflect.set(target, RumbleshipContextIdKey, context_id);
  return target as T & { [RumbleshipContextIdKey]: string };
}
export function getContextId(target: Record<string, any>): string | undefined {
  return Reflect.get(target, RumbleshipContextIdKey);
}

export const RumbleshipActingUserKey = '_@RumbleshipActingUserKey';
export function setAuthorizedUser<T extends Record<string, any>>(
  target: T,
  authorizer: Authorizer
): T & { [RumbleshipActingUserKey]: string } {
  Reflect.set(target, RumbleshipActingUserKey, authorizer.getUser());
  return target as T & { [RumbleshipActingUserKey]: string };
}

export function getAuthorizedUser(target: Record<string, any>): string | undefined {
  return Reflect.get(target, RumbleshipActingUserKey);
}
