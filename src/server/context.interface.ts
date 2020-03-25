import Container, { ContainerInstance } from 'typedi';
import uuid = require('uuid');
import { Authorizer, Scopes, createAuthHeader } from '@rumbleship/acl';
import { RumbleshipBeeline, HoneycombSpan } from '@rumbleship/o11y';
import { logging } from '@rumbleship/spyglass';
import { RFIFactory } from '@rumbleship/service-factory-map';

export interface RumbleshipContextOptionsPlain {
  config: object;
  id?: string;
  authorizer?: Authorizer;
  logger?: SpyglassLogger;
  container?: ContainerInstance;
  initial_trace_metadata?: object;
}

class RumbleshipContextOptionsWithDefaults {
  private readonly _logger: SpyglassLogger;
  private readonly _container: ContainerInstance;
  private readonly _authorizer: Authorizer;
  private readonly _id: string;
  private readonly _initial_trace_metadata: object;
  private readonly _config: object;
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
  constructor(filename: string, options: RumbleshipContextOptionsPlain) {
    this._config = options.config;
    this._id = options.id ?? uuid.v4();
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

interface Context {
  id: string;
  beeline: RumbleshipBeeline;
  trace: HoneycombSpan | null;
  container: ContainerInstance;
  authorizer: Authorizer;
  logger: SpyglassLogger;
}

export class RumbleshipContext implements Context {
  // Shouldn't generally be needed, but is useful when handing one trace off to a different one.
  public trace = null;
  private static initialized: boolean = false;
  private static _serviceFactories: Map<string, RFIFactory<any>>;
  static addSequelizeServicesToContext: (c: RumbleshipContext) => RumbleshipContext;
  static initialize(
    serviceFactories: Map<string, RFIFactory<any>>,
    addSequelizeServicesToContext: (c: RumbleshipContext) => RumbleshipContext
  ) {
    this._serviceFactories = serviceFactories;
    this.addSequelizeServicesToContext = addSequelizeServicesToContext;
    this.initialized = true;
  }
  static make(filename: string, options: RumbleshipContextOptionsPlain): RumbleshipContext {
    if (!this.initialized) {
      throw new Error('Must initialize the RumbleshipContext before making instances');
    }
    const { authorizer, container, id, logger } = new RumbleshipContextOptionsWithDefaults(
      filename,
      options
    );

    container.set('logger', logger);
    container.set('authorizer', authorizer);

    for (const [factory_name, factory] of this._serviceFactories.entries()) {
      container.set(factory_name, factory);
    }

    const beeline = container.get<typeof RumbleshipBeeline>('beelineFactory').make(id);
    const ctx = new RumbleshipContext(id, container, logger, authorizer, beeline);
    logger.debug(`NEW SERVICE CONTEXT: ${ctx.id}`);
    const withSequelize = this.addSequelizeServicesToContext(ctx) as RumbleshipContext;
    return withSequelize;
  }

  constructor(
    public id: string,
    public container: ContainerInstance,
    public logger: SpyglassLogger,
    public authorizer: Authorizer,
    public beeline: RumbleshipBeeline
  ) {}

  release() {
    this.beeline.finishRumbleshipContextTrace();
    this.logger.debug(`RELEASE SERVICE CONTEXT: ${this.id}`);
    this.container.reset();
  }
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
