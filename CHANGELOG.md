# Changelog

All notable changes to this project will be documented in this file. Starting with v0.1.2.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [UNRELEASED]

### Added
### Removed
### Changed
### Fixed
  * An error inside an @QSObserver does not ack the message.
### Deprecated
### Security


## [13.5.0] -- 2020-12-22

### Added
  * `IterableExternalConnection` version of `IterableConnection` that expects types generated from schema -- e.g. without `_service`. 
### Fixed
  * QueuedSubscriptionServer iterates over all QSRs, not just first 100.

## [13.4.8] -- 2020-12-15

### Changed
  * newTransaction, endTransaction emit log info @ debug

## [13.4.7] -- 2020-11-13

### Changed
  * Disable connection tracing hooks by default:
    * upgrade to `@rumbleship/config#2.1.2`

## [13.4.6] -- 2020-11-12

### Fixed
  * attach connection tracing hooks after authenticating sequelize

## [13.4.5] -- 2020-11-12

### Added 
  * tracing for db connection pool

## [13.4.4] -- 2020-11-05

### Changed
  * export addErrorToTraceContext to index.ts

## [13.4.3] -- 2020-10-31

### Added 
  * improved tracing in queued graphql
### Removed
  * helper to force `-private` to `-public` for pubsub

## [13.4.2] -- 2020-10-30

### Fixed
  * src/gql/resolvers/filter-by-subscription-filter.ts to always add id to the filter for the findOne auth check

## [13.4.1] -- 2020-10-29

### Removed
  * `created_at` is no longer watchable

## [13.4.0] -- 2020-10-29

### Changed
  * Instantiating RfiPubSub in a private project (e.g. banking) connects to PubSub in the associated public project

## [13.3.0] -- 2020-10-28

### Changed
  * renamed SubscriptionHandler to QSObserver
  * Made the list of the Resolvers passed into the initServer function also the list of QSObservers
    * removed base class QueuedSubscriptionObserver so that any class can have a QSObserver method
  * renamed the class QueuedGqlRequestClientOneInstanceResponder  to class QueuedGqlRequestClientSingleInstanceResponder 
  * changed the invocation of an QSObserver handler, to use TypeDI's service mechanism to inject the services etc.

### Fixed
  * When a Qsr changes, ensures that it is reloaded by the active QueuedSubscription

## [13.2.0] -- 2020-10-25

### Added
  * QueuedSubscriptionManager and QueuedSubscriptionObserver classes
  * @SubscriptionHandler decorator 
  * initQueuedGraphQl(), startQueuedGraphQL() and stopQueuedGraphQl() functions to manage all the Queued servers and client managers lifeccyle 
  
### Changed
  * BREAKING CHANGE - SubscriptionObserver array needs to be passed in to initServer
    * can be an empty array, otehrwiise should be classes derived from QueuedSubscriptionObserver
  * improved internal naming of subscription_name vs gcloud_subscription_name
  * integrated QueuedObserver lifecyle into initServer

## [13.1.0] -- 2020-10-22

### Added
  * support for returning the delta for any property listed in watchlist parameter in a subscription

## [13.0.8] -- 2020-10-20

### Fixed
  * addin check for subscription already exists in src/queued-graphql/helpers/gcp_helpers.ts

## [13.0.7] -- 2020-10-20

### Added
  * alert parameter to addErrorToTraceContext to allow a Honeycomb alert should/should not be normally raised on this error.
  * set alert to false on QueuedRequest response error reporting to tracing
### Fixed
  * tracing OnDemandContext 
  * QueuedSubscription initial subscribe ensuring that the context is  onDemandContext.reset() before entering the for await...


## [13.0.6] -- 2020-10-19

### Changed
  * upgraded @google/pubsub to 2.5.0 

## [13.0.5] -- 2020-10-19

### Added
  * delete on stop subscription option in RfiPubSubSubscritpion fro instance specific subscriptions
  * added additional tracing to QueuedSubscriptionServer

## [13.0.4] -- 2020-10-18

### Added
  * Add @AddToTrace to QueuedSubscription methods where appropriate
### Removed
  * remove gaeVersion check on load cache
### Changed
  * lightly refactor QueuedSubscriptionServer to separate handlers out of closures for improved tracing

## [13.0.3] -- 2020-10-16

### Removed
  * remove extraneous error report on queued gql requests 

### Fixed
  * fix defect in adding QsrLocalCacheModel scope to dbModels

## [13.0.2] -- 2020-10-15

### Added
  * add scope/dbModel for the local QsrCache mapping to initServer 
### Changed
  * upgraded Oid library to 4.0.8

## [13.0.1] -- 2020-10-15

### Changed
  * improved separation of updating cache and updsating active subscriptions
### Fixed
  * dropped subscriptuion prefix which meant that messages for qsr changes were not being consistently picked up by services 


## [13.0.0] -- 2020-10-14


### Added
  * `user.id` and `user.scope` extracted from authorizer and added to traceContext on ApolloServer context cb
  * QueuedServer clients for QueuedSubscriptions and QueuedRequests
  * QueuedRequestServer - adding support for gql operations: Queuery and Mutation over pubsub
  * Sending of the apps graphQL schema on start up to the Qsr Management Service
  * local cache fro this applications Qsrs
  * subscription to Qsr updates and update of local cache
  * Retrieve all Qsr's on startup via gcloud pubsub to refresh cache
  
### Changed
  * BREAKING
    * Moved QSR repository from individual services to a central service
  * Refactored QueuedSubscription folders
  * initServer to include starting the QueuedSubscription servers for subscriptions and requests over gcloud pubsub

### Fixed
  * RelayOrderByGQL to correctly handle when it is parsed as an ObjectType - ie if it is a variable in a document or embedded

## [12.0.4] -- 2020-10-13

### Changed
  * LogError middleware inflects span name from error constructor, matches new addTraceContext form


## [12.0.3] -- 2020-09-29

### Changed
  * QSRs are delivered in an ordered capacity

## [12.0.2] -- 2020-09-22

### Added
  * added using config.Gcp.pubSubInvokerServiceAccount to Webhook subscription creation so that the webhook will have an authenticated header from the google pubsub system 

### Changed
  * upgraded @rumbleship/config to 2.1.0
### Fixed
  * remove hardcoded Scope prefix in front of the onQueuedSubscriptionRequestChange subscription in the QuesedSubscriptionServer

## [12.0.1] -- 2020-09-19

### Added
  * option to change the prefix for the QueuedSubscriptionREquest and Webhook Relay objects, Queries and Mutations 
    - To use, `Container.set('WebhookAndQSRPrefix', 'yourPrefixHereCanBeEmpty');` *BEFORE* the first import of @rumbleship/gql

## [12.0.0] -- 2020-09-18

### Breaking Changes: 
  * Must incorporate migrations for QueuededSubscriptionServer and Webhooks. See README.md for details

### Added
  * RelayMutation Mixin functions to support the standard Relay 'Mutation' of a clientMutationId passed in and returned and helpers to automatically set it.
  * eslint warning suppression as appropriate
  * Added Webhook functionality allowing for any allowable graphQl subscription to used to 
  fire a webhook
    - Migrations for QueuedSubscriptionRequests and Webhooks
    - added full Relay and database models and services for Webhook that persist the webhook configuration and service functionality to setup google pubsud to call the webhook when a QueuedSubscriptionRequest emits a subscription message.

### Removed
  * tslint.json 
### Changed
  * refactored folder structure of QueuedSubscriptionServer to map to rfi conventions of graphql/database models
  * renamed QueuedSubscriptionRequest attributes 
    - authorized_requestor_id to owner_id and 
    - client_request_id to subscription_name
  * changed the @AuthorizorTreatAs() on owner_id to be both User and Division.
  * change QueuedSubscriptionServer startup to create any gcloud subscriptions and topics defined in teh webhooks table if they havn't already been created.

### Fixed
  * multiple generation of included associations when and authorizeThrough is defined for a single table inheritance class
  * overwrite of @AuthorizerTreatAs attributes when used in multiple sub-classes in single table inheritence class

## [11.0.5] -- 2020-09-01

### Changed
  * tslint -> eslint

## [11.0.4] -- 2020-08-26

### Added
  * gqlToDb helper on the SequelizeBaseService

## [11.0.3] -- 2020-08-21

### Fixed
  * missing @Resolver decorator in withSubscriptionResolver()

## [11.0.2] -- 2020-08-21

### Fixed
  * SequelizeBaseService .getAll(), .getAssociatedMany() and .count() to do the countAll with 
  unscoped queries. As using default scopes on models messes the count up (number of rows returned, rather than the actual number of entries).


## [11.0.1] -- 2020-08-21

### Fixed
  * `filter-by-subscription-filter.ts` exported to root

## [11.0.0] -- 2020-08-21


### Added
  * Section to README.md with check list of changes needed for apps migrating from
    version 10 to this (version 11) of framework.
  * BREAKING CHANGE
    * Added QueuedSubscriptionRequest full stack Gql Relay
      * All framework apps now requre a table 'queued_subscription_requests' adding.
        see src/queued-subscription-server/queued_subscription_request/db/_example_migrations for details
      * all typeGraphQl resolvers that use @Subscription decorator should now use
      @RumbleshipSubscription
      * calls to addNodeServicesToContainer require the context to be passed in
    * added `lodash` as a peer dependancy
    * Added idempotency_key to NodeChangePayload and dependants to support deduplication of subscription notifications
    * when a ClassGqlNodeNotifcation is constructed, a idempotency_key must be included. This is set in the publish from the sequelize hooks. However, it must be extracted from the RawPayload the graphQl resolver reieves and then set in the constructor of the return structure
  * OnDemandContext which is a specialized RumbleshipContext that can be passed into long running processes and 'reset' by call backs. Used by QueuedSubscriptionRequest 
  * added a 'watchList' to base Resolver subscriptions that allows clients to specifiy
  which properties should be 'watched' for change.
  * exported unique-subscription-name-part, plugins and routes
  
### Removed
  
### Changed
  
  * BREAKING CHANGE
    * buildBaseResolver()... takes an addtional ClassType, a filter class that is built using withSubscriptionFilter see Orders service for example usage
    * @Subscription usage is deprecated and @RumbleshipSubscription MUST be used
    * @Watchable decorator identifies properties that can be 'watched' in a subscription for change
    
  * initServer initializes QueuedSubscriptionServer
    * adds QueuedSubscription
  * RfiPubsub now supports both 'queued' style gql subscriptions as well as broadcast UX style gql subscriptions 
    * uses mechanism implmented via unique-subscription-name-part and @RumbleshipSubscriptions 
    coupled with the OnDemandContext to select appropriate subscription type for context
  * upgraded version of @rumbleship/config to 2.0.0
  * Upgrade packages:
    - "type-graphql": "^1.0.0",
    - "typescript": "^3.9.7",
    - "sequelize-typescript": "^1.1.0"
  * Explicitly set the 'type => ...' for edges in GqlConnection() and buildConnectionClass() functions to [gqlEdge] as per typeGraphQl v1.0.0 change log


## [10.3.3] -- 2020-08-18

### Fixed
  * Fixed nested transaction not having the authorized user attached or context id in the update fiunction by: 
    - add support for nested transactions in the BaseSequelize.newTransaction() call and use in the update function
    - correctly find the outerMost transaction when publishing changes int eh sequelize hook so that nested transaction changes are ONLY published when the outer most transaction is committed


## [10.3.2] -- 2020-08-05

### Fixed
  * Explicitly wrap BaseResolver.FilterById in `bindToTrace`

## [10.3.1] -- 2020-08-04

### Fixed
  * Binding of BaseResolver.filterById

## [10.3.0] -- 2020-08-01

### Added
  * Ability to filter by id on all default `onChange` subscriptions
    * Exposes static `GQLBaseResolver.filterById` for custom subscriptions to use downstream
  * SequelizeBaseService.getOne() throws `NotFoundError` instead of generic `Error` if not found
### Fixed
  * Accidental drop of dev db on startup

## [10.2.3] -- 2020-07-30

### Changed
  * Upgrade to `@rumbleship/acl#2.0.1`
  * Upgrade to `@rumbleship/config#1.0.2`

## [10.2.2] -- 2020-07-30

### Changed
  * Upgrade to `@rumbleship/acl#2.0.0` with automatic assignment of ServiceUser

## [10.2.1] -- 2020-07-29

### Fixed
  * dbSuffix option correctly separates db name from suffix with `_`

## [10.2.0] -- 2020-07-22

### Added
  * Persist the user who triggered a notification on the notification payload: https://www.pivotaltracker.com/story/show/173904113
    * Forced creation of transactions for `SequelizeBaseService.create` and `SequelizeBaseService.update` if they aren't passed in via `NodeServiceOptions`

## [10.1.6] -- 2020-07-18

### Fixed
  * Boilerplate test for mixin typesafety

## [10.1.5] -- 2020-07-17

### Fixed
  * Mixins don't add `{[index: string]: any}` type any more

## [10.1.4] -- 2020-07-16

### Fixed
  * Default order_by is `[[updated_at, DESC]]`

## [10.1.3] -- 2020-07-16

### Fixed
  * Also need to remove the `__${new_field}` convenience prop

## [10.1.2] -- 2020-07-16

### Fixed
  * Only add key for new field if value from deprecated field exists
  * Getters/setters for shared properties in deprecated logic reference instance, not class

## [10.1.1] -- 2020-07-15

### Removed
  * `getAuthorizerTreatAsNoDefault()` in favor of exported fn from `@rumbleship/acl#1.4.0`
### Changed
  * Upgrade to `@rumbleship/acl#1.4.0` in peer, dev

## [10.1.0] -- 2020-07-14

### Added
  * @AliasFromDeprecatedField decorator that allows changes to api object fields to be made in forward/backward compatible manner
  * `RelayInputTypeBase<T>` interface to help with typechecking for GQL @InputTypes
### Fixed
  * SequelizeBaseService.can() explicitly uses `getAuthorizerTreatAsNoDefault()` instead of relying on `@rumbleship/acl's` default, which includes the inflected default attributes

## [10.0.0] -- 2020-07-01

### Changed
  * RumbleshipContext factory must be initialized with the implementing service's rendered config
  * Incorporating consolidated configs from @rumbleship/config:
    * Separate auth from config when instantiating a PubSub
  * Moved `withRumbleshipContext()` to be a static or RumbleshipContext
  * Upgraded peers:
    * @rumbleship/spyglass#4.0.0
    * @rumbleship/config#1.0.0

## [9.2.1] -- 2020-06-29

### Changed
  * Filter mixin generic types better named
### Fixed
  * Only log err.details on schema gen if it exists as array

## [9.2.0] -- 2020-06-27

### Added
  * Centralized `initServer` logic
### Removed
  * `iterable-model` is no longer a peer
### Changed
  * Extract convict config schemas to separate package, `@rumbleship/config`

## [9.1.0] -- 2020-06-26

### Added
  * buildEdgeClass() and buildConnectionClass()
      creates base classes for graphql Relay Connection and Edges. Supports using graphql Interface class for the creation of the schema, and using the concrete class for the typescript implementation
### Deprecated
  * GQLEdge and GQLConnection in favour of buildEdgeClass() and buildConnectionClass()

## [9.0.1] -- 2020-06-25

### Added
  * SequelizeBase.addAuthorizationFiltersAndWrapWithTransaction<T>(...)
    For use in create and update methods in subclasses of a service where multiple entities across multiple tables need to be updated.
  * RelayOrderBy scalar for use in filters to specify the return order for Gql Queries
  * interface RelayFilterBase<T> as base for TFiltter in RelayService interface
      This defines all of the (optional) fields for pagination, timestamps, and orderBy
  * createOrderClause() as helper to construct an sequelize order clasue using the RelayOrderBy
  * mixins to be used when defining a Filter for a Relay object:
      withOrderByFilter(),withPaginationFilter(), withTimestampsFilter()
  * mixin to be used with a Relayclass to add the standard Timestamp fields:
      created_at, deleted_at and updated_at

### Removed
  * accidental duplication of convert-to-sequelize-date-filters.ts and create-where-clause-with.ts
  * incorrect use of sequelize Order class in API for SequelizeBase service

### Changed
  * addAuthCheckHook to also check for an authorized transaction

## [9.0.0] -- 2020-06-25

### Changed
  * IMPORTANT. Apps using this lib MUST upgrade there dependancies to these versions:
    "class-transformer": "^0.2.3",
    "class-validator": "^0.12.2",
    "graphql": "^15.0.0",
    "subscriptions-transport-ws": "^0.9.16",
    "type-graphql": "1.0.0rc.2",
    "typescript": "^3.9.4",



## [8.1.0] -- 2020-06-23

### Added
  * Propagate trace context over the pub/sub bus
  * Generic traceContext added for `node.id`, various filters inside `SequelizeBaseService`
  * Definition of the `SubscriptionCommandPayload`, inherits from generic `Payload`
### Removed
  * dependency on `@google/grpc-js`
  * SpyglassLogger interface from exports
### Changed
  * Peer dependency is `@rumbleship/o11y#4.0.1`
  * Subscription-related interface called `Payload` now called `NodeChangePayload`, inherits from generic `Payload`

## [8.0.0] -- 2020-06-12

### Added
  * `createPayload` to replace `[createPayloadWithStr, createPayloadWithOid]`
  * peer dependency on `@rumbleship/iterable-model-sequelize`
### Removed
  * `createPayloadWithStr`, `createPayloadWithOid` in favor of plain `createPayload`
  * peer dependency on `iterable-model`
### Changed
  * bind the retrieval of node generation of payload for notifications to current trace
  * Huge filestructure refactor
  * `AddToTrace()` throughout base resolvers and services
  * Implementation of `findEach` now uses generators

## [7.1.4] -- 2020-06-10

### Removed
  * `deleting | deleted subscription` logging

## [7.1.3] -- 2020-06-10

### Changed
  * Assign framework-expected attributes (_service, id, etc) *before* assigning implementation-derived attributes (which may expect _service, id, etc to be defined) when converting from db to gql

## [7.1.2] -- 2020-06-05

### Changed
  * `@ExtensibleEnumColumn` replaces spaces in enum values with underscores

## [7.1.1] -- 2020-06-02

### Added
  * `defaultValue` to accepted options for `@ExtensibleEnumColumn`
### Fixed
  * `Array.isArray(foo)` instead of `foo instanceof Array`

## [7.1.0] -- 2020-05-29

### Added 
 * `ExtensibleEnumColumn` to de/decorators folder

## [7.0.9] -- 2020-05-20

### Added
  * Context.realease() queries for `prepared_stmt_count` as well

## [7.0.8] -- 2020-05-18

### Fixed
  * If error in `context.release()` swallow and log

## [7.0.7] -- 2020-05-16

### Fixed
  * send db variable values as number

## [7.0.6] -- 2020-05-16

### Changed
  * `ctx.release()` now async; collects and sends interesting mysql variables to trace on close

## [7.0.5] -- 2020-05-15

### Fixed
  * dbSuffix only is applied if set

## [7.0.4] -- 2020-05-15

### Added
  * Centralized convict defaults for database config
  * Support (+default:100) for setting `db.dialectOptions.maxPreparedStatements`
### Changed
  * Refactored `sequelizeOptions` to be strongly typed; 
### Deprecated
  * Passing entire `config` into `initSequelize()`; pass exclusively the `db` object that conforms to `RumbleshipDatabaseOptions` shape.

## [7.0.3] -- 2020-05-13

### Fixed
  * Fixed incorrect logic on createTopicIfNotExist() in pubSub

## [7.0.2] -- 2020-05-06

### Added
  * Default ordering by [[id, desc]] on getAssociatedMany()
### Removed
  * Fallback support for ordering by `created_at` on old (uuid-primary) tables

## [7.0.1] -- 2020-04-30

### Removed
  * `withRumbleshipContext`, `withLinkedRumbleshipContext`, `releaseRumbleshipContext`

## [7.0.0] -- 2020-04-30

### Added
  * RumbleshipContext.make() takes an optional `marshalled_trace` to propagate, optional `linked_span` to link to
  * **IMPORTANT** Peer + dev dependency on `@rumbleship/o11y` bumped to 3.0.0
### Changed
  * Instantiating a RumbleshipContext automatically starts its (possibly distributed, possible linked) trace.

## [6.0.3] -- 2020-04-22

### Changed
  * Modified RumbleshipContext to only finish a trace if there is a trace set in the context.
  * added resetHostedSubscriptions to the RfiPubSubConfig interface

## [6.0.2] -- 2020-04-20

### Changed
  * package.json engine supports node 12

## [6.0.1] -- 2020-04-14

### Changed
  * RumbleshipContext.make() now accepts a third parameter of the factories to use (primarily for testing)

## [6.0.0] -- 2020-04-02

### Added
  * BaseResolver assigns `.ctx:RumbleshipContext` on construction
  * `RumbleshipContext` and helpers as a top level exported class to be used in lieu of just `Context.interface`
  * `withContext()` 
### Changed
  * Updated tslint.json, tsconfig.json, plugins, etc to support nullish coalescing.
  * Upgrade to `@rumbleship/o11y#1.0.0`

## [5.0.4] -- 2020-03-13

### Added
  * Bluebird as dev+peer dep
### Changed
  * Creating and deleting subscriptions en masse uses Bluebird Promise.map()

## [5.0.3] -- 2020-03-12

### Fixed
  * createSubscriptionsFor create the topic before createing subscription if the topic doesn't already exist

## [5.0.2] -- 2020-03-11

### Added
  * unsubscribeAll to theRfiPubSub 

## [5.0.1] -- 2020-03-10

### Removed
  * Extraneous Permissions metadata

## [5.0.0] -- 2020-03-09

### Changed
  * GqlSingleTableInheritanceFactory returns () => ClassType<Tgql> instead of just ClassType<TGql>

## [4.2.0] -- 2020-03-06

### Added
  * option to support 'service' subscriptions. I.e. only one instance of a service that subscribes gets an event from the pub-sub queue
  * Remove the banking hack test and uuid oid tests as we no longer support uuid based oid's

## [4.1.0] -- 2020-02-27

### Added
  * publisher_version to the constructor of RfiPubSub
  * embed the publisher_version to every message that is sent out

## [4.0.7] -- 2020-02-19

### Changed
  * ENV variable to set credentials `GCP_PUBSUB_KEY_FILE_NAME`--> `GOOGLE_APPLICATION_CREDENTIALS` (default for GCP service)

## [4.0.6] -- 2020-02-15

### Added
  * Helpers for dev/test implementors of RFIPubSub to enable full reset of hosted env
    * PubSub.resetHostedSubscriptions -> default:false
    * `deleteCurrentSubscriptionsMatchingPrefix()`
    * `createSubscriptionsFor(dbModels)`

## [4.0.5] -- 2020-02-14

### Added
  * Ability to clear all current subscriptions

## [4.0.4] -- 2020-02-14

### Changed
  * default order to [['id': 'DESC']] if a number and created_at if id is not a number (ie banking)

## [4.0.3] -- 2020-02-11

### Fixed
  * Don't override PubSub topic prefix in hosted environments

## [4.0.2] -- 2020-02-07

### Added
  * added function to validate config to RfiPubSub contructor
  * added prefixTopic to publish and subscribe 'triggerName' which is retrieved from the config
    * This is used to create a unique set of topics and subscriptions for the 'sub' environement 
      I.e. each developer wont clash when we are sharing a single queue
### Changed
  * moved classes and functions out of pubsub/index.ts

## [4.0.1] -- 2020-02-06

### Fixed
  * removed unnecessary randon muber in subscription name
    * Each instance has its own subscription by host name
  * removed superfluous NODE_NOTIFICATION string from subscription
  
### Security

## [4.0.0] -- 2020-02-03

### Changed
  * Major Version number change

## [3.1.3] -- 2020-02-03

### Added
  * function to get an Oid from a sequelize db Model instance
  * Added the @google-cloud/pub-sub, @axelspringer/grapql-google-pubsub and @grpc/grpc/js packages to dev and peer dependancies
  * upgraded to version 3.0.0 of @rumblship/oid
  * created an "RfiPubSubEngine" as a derivative of the grapql-google-pubsub engine and associated helpers

### Removed
  * Support for o11y 'WithSpan and honeycomb- temporay fix for issues with trace and span in apps
  * BREAKING CHANGE - removed class DbModelChangeNotification as all db changes are now communicated via PubSub

### Changed
  * breaking change: initSequelize now takes an array of ModelCtr/scopename pairs instead of just ModelCtr.
  * Chnges to database are communicated via PubSub and use an Oid to indicate what thing changed and an array of deltas to indicate what attributes changed
  * topics have 'Model' removed from name. Uses the scope name assigned to the dbModel during intiSequelize for publish: For subscribe, the capitalizedName passed into the BaseResolver is used.
  * the gqlSubscription on the nodeREsolver (ie you can subscribe to all changes to any node) now uses the scope of the oid to find the appropriate service rather than using class names

  

## [3.1.2] -- 2020-01-31

### Added
  * (quick hack) Optional trailing parameter `order` on SequelizeBaseService.getAssociatedMany()

## [3.1.1] -- 2020-01-25

### Added
  * honeycomb-beeline` as peer + dev dep

## [3.1.0] -- 2020-01-24

### Added
  * Peer & dev dependency: @rumbleship/o11y#0.0.7
  * Auto spanning in db.services

## [3.0.3] -- 2020-01-23

### Fixed
  * findOne uses `first` not `limit`
  * Magic Authorization:
    * AuthorizeContextKey is now a plain string; not a symbol -- Sequelize didn't like cloning the symbol
    * Optional (default: false) flag passable when adding the `AuthorizationFilters` -- force `$count` to not include attributes on models used to derive auth.
  * Allow explicit auth-skip for reloading sequelize models.

## [3.0.2] -- 2020-01-15

### Fixed
  * fixed introduced double loading of eager loaded associated objects

## [3.0.1] -- 2020-01-14

### Added
  * Add lint "no-floating-promises": true,
  * Update code to explictly state when floating promise wanted
### Fixed
  * Update code missing an await

## [3.0.0] -- 2020-01-14

### Added
  * added convertToSequelizeDateFilters utility class to convert DateRange objects to sequelize
    where clauses
  * Added @AuthorizeThrough decorator as a companion to @AuthorizerTreatAs to enable authorization filtering via associated classes
    * added helpers to enable implmentation in SequelizeBaseService
### Removed
  * BREAKING CHANGE  * removed modelToClass in favor of SequelizeBaseServiceInterface.gqlFromDbModel()

### Changed
  * BREAKING CHANGE: Changed extended ACL logic to queries, updates. 
    * REQUIRES the method SequelizeBaseService.addAuthorizationFilters to be called on a sequelize FindOptions object before any sequelize 'find' operation is called
  * createWhereClauseFilter(filter) now calls convertToSequelizeDateFilters(filter) so both oids and DateRanges are converted to sequelize filters
### Fixed
  * createWhereClause correctly checks the type of an id before trying to coerce to a database id

## [2.0.0] -- 2019-12-15

### Changed
  * Upgrade to `@rumbleship/acl#1.0.0`
    * Removed references to the `PermissionsMatrix` in favor of class-based `Permissions` object

## [1.1.0] -- 2019-12-10

### Added
* Adds 'delta's to the DbNotification allow reasoning around what has changed when subscribing at the Db Model level
* This DOES NOT propagate to the GqlSubscriptions, as sending all the deltas to any old client is a big security hole. 
### Changed

### Fixed
reloadFromModel when there was NO custom getter, referenced to the data rather than cloned

## [1.0.1] -- 2019-10-30

### Changed
  * Peer dependency for `@rumbleship/oid` updated to 1.0.2

## [1.0.0] -- 2019-10-30

### Added
  * dev and peer depedency on `@rumbleship/oid`, which abstracts managing oids across the Rumbleship ecosystem
### Removed
  * defintion of `oid.type`; see new dependency on `@rumbleship/oid`
### Changed
  * `createWhereClause` is an explicitly defined function, instead of a static on `Oid`

## [0.2.4] -- 2019-10-21

### Changed
  * AuthChecker no longer tries to inflect about creation rights in Auth question #4, instead
    it simply asks for querying whatever data got created.

## [0.2.3] -- 2019-09-13

### Fixed
  * Description of DateRange in gql description to NOT use doubl quote character

## [0.2.2] -- 2019-08-23

### Added
  * Logging inside of `SequelizeBaseService.endTransaction()`

## [0.2.1] -- 2019-08-23

### Added
  * SequelizeBaseService.getContext(): Context;
  * SequelizeBaseService.endTransaction(), which wraps ending a transaciton in spyglass logging.

## [0.2.0] -- 2019-08-14

### Added
  * Integration with ACL and Generic Rumbleship authorization scheme
  * Spyglass metadata logging

## [0.1.1] -- 2019-08-12

### Added
  * circle ci
  * pulled all type-graphql and typescript-sequelize RFI boiler plate and framework and the Relay Connection and Oid functionality from banking into this repo
### Security

