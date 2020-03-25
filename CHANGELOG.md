# Changelog

All notable changes to this project will be documented in this file. Starting with v0.1.2.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [UNRELEASED]

### Added
  * BaseResolver assigns `.ctx: Context` on construction
### Removed
### Changed
  * Updated tslint.json, tsconfig.json, plugins, etc to support nullish coalescing.
### Fixed
### Deprecated
### Security


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
    * PubSubConfig.resetHostedSubscriptions -> default:false
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

