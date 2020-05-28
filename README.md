# @rumbleship/gql
Rumbleship's RelayAPI style framework for creating graphql/sequelize  services

## Setting up Subscriptions

### Emulator versus the real deal
  * docker version 
  * configs
    * add to config.test.json
      ,
  ``` 
              "PubSubConfig": {
                "keyFilename": "/dev/null",
                "topicPrefix": "mat-test"
              }
  ```
    * add to test-config.json ( this is the config that is checked in and is run in circleci)
### vscode:-  
  * launch.json
    *  add emulator to env's
### package.json
   - test script
   - @google libs to right versions
   - make sure grpc-js is right version
### initServer 
   - pub/sub to build schema
   - connect to 
 .circleci/config.yml
 add config/test-config.json , and the commited credetnial file