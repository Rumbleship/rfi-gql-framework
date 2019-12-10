# Changelog

All notable changes to this project will be documented in this file. Starting with v0.1.2.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [UNRELEASED]

### Added
* Adds 'delta's to the DbNotification allow reasoning around what has changed when subscribing at the Db Model level
* This DOES NOT propagate to the GqlSubscriptions, as sending all the deltas to any old client is a big security hole. 
### Removed
### Changed

### Fixed
reloadFromModel when there was NO custom getter, referenced to the data rather than cloned
### Deprecated
### Security


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

