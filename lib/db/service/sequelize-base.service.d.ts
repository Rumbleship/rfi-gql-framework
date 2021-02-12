import { Transaction, FindOptions, LOCK } from 'sequelize';
import { Model } from 'sequelize-typescript';
import { Actions, Permissions, AuthorizerTreatAsMap } from '@rumbleship/acl';
import { Oid } from '@rumbleship/oid';
import { Connection, Edge, Node, NodeService, NodeServiceOptions, NodeServiceTransaction, NodeServiceIsolationLevel, NodeServiceTransactionType, RelayFilterBase } from '../../gql';
import { ClassType } from '../../helpers';
import { RumbleshipContext } from '../../app/rumbleship-context';
import { GqlSingleTableInheritanceFactory } from '../transformers';
import { ModelClass, SequelizeBaseServiceInterface } from './sequelize-base-service.interface';
import { NodeServiceMap } from '../../app/server/add-node-services-to-container';
export declare function getSequelizeServiceInterfaceFor<TApi extends Node<TApi>, TModel extends Model<TModel>, TConnection extends Connection<TApi>, TFilter, TInput, TUpdate, V extends NodeService<TApi>>(service: V): SequelizeBaseServiceInterface;
export declare class SequelizeBaseService<TApi extends Node<TApi>, TModel extends Model<TModel>, TEdge extends Edge<TApi>, TConnection extends Connection<TApi>, TFilter, TInput, TUpdate, TDiscriminatorEnum> implements SequelizeBaseServiceInterface<TApi, TModel, TConnection, TFilter, TInput, TUpdate> {
    protected relayClass: ClassType<TApi>;
    protected edgeClass: ClassType<TEdge>;
    protected connectionClass: ClassType<TConnection>;
    protected model: ModelClass<TModel> & typeof Model;
    protected ctx: RumbleshipContext;
    protected options: {
        permissions: Permissions;
        apiClassFactory?: GqlSingleTableInheritanceFactory<TDiscriminatorEnum, TApi, TModel>;
    };
    protected static hooksMap: Set<typeof Model>;
    private nodeServices;
    private permissions;
    constructor(relayClass: ClassType<TApi>, edgeClass: ClassType<TEdge>, connectionClass: ClassType<TConnection>, model: ModelClass<TModel> & typeof Model, ctx: RumbleshipContext, options: {
        permissions: Permissions;
        apiClassFactory?: GqlSingleTableInheritanceFactory<TDiscriminatorEnum, TApi, TModel>;
    });
    /**
     *
     * If there is a transaction or skipAuthorizationCheck has been set, returns true. It is assumed
     * that a priror call has been made and the entire 'use-case' is authorized.
     *
     * The 'can' method is primarily used to ensure that the Actions.UPDATE and ACTIONS.CREATE operations
     * are allowed, (and possibly other actions that are not queries).
     *
     * This is tricky, as the data that is used to identify whether the Operation is allowed,
     * may be held on an associated object and could itself be uncommitted or stale. In the case
     * of the create operation, the associated object that is used to test authorization may not
     * of been associated at this point.
     *
     * One way to solve these issues, is that the 'authorizable' object becomes an instance of the
     * Relay Input or Update class, and these classes are decorated with @AuthorizerTreatAs()
     * on the attributes that represent the instance of an authorizable resource.
     *
     * For an update, it is also possible to do a query with Action.UPDATE set...
     *
     */
    can(params: {
        action: Actions;
        authorizable: Record<string, any>;
        options?: NodeServiceOptions;
        treatAsAuthorizerMap?: AuthorizerTreatAsMap;
    }): boolean;
    /**
     * Connects the options passed into the API to the sequelize options used in a query and the
     * service that is being used.
     *
     * @param findOptions Typically the FindOptions sequelize object passed into a query
     * @param nodeServiceOptions The framework options passed into the API
     * @param authorizableClass The decorated class to use to determine what attributes are to used as filters
     */
    addAuthorizationFilters(findOptions: FindOptions, nodeServiceOptions: NodeServiceOptions, authorizableClass?: ClassType<Record<string, any>>, forCountQuery?: boolean): FindOptions;
    /**
     *
     * Called by the setAuthorizeContext. Dont call directly unless you have totally overridden
     * the auth and want to do some special processing...
     *
     * @param findOptions
     * @param nodeServiceOptions
     */
    protected addAuthorizationToWhere(authorizableClasses: Array<ClassType<Record<string, any>>>, findOptions: FindOptions, nodeServiceOptions?: NodeServiceOptions, forCountQuery?: boolean): FindOptions;
    /**
     * This should be called ONLY by the service contructor and adds the authorization check
     * to the sequelize Model Class.
     *
     * @param modelClass
     */
    static addAuthCheckHook(modelClass: typeof Model): void;
    addAuthorizationFiltersAndWrapWithTransaction<T>(options: {
        opts: NodeServiceOptions;
        authorizableClass?: ClassType<Record<string, any>>;
    }, theFunctionToWrap: (sequelizeOptions: {
        transaction?: Transaction;
    }) => Promise<T>): Promise<T>;
    setServiceRegister(services: NodeServiceMap): void;
    nodeType(): string;
    /**
     * Creates the appropriate gql Relay object from the sequelize
     * Model instance. Note that eager loaded associated Models are NOT converted.
     * @param dbModel
     */
    gqlFromDbModel(dbModel: TModel): TApi;
    /***
     * ONLY to be used from the implmentation of another SequelizeService.
     */
    dbModelFromGql(relayObject: TApi): TModel;
    dbModel(): ModelClass<TModel> & typeof Model;
    getContext(): RumbleshipContext;
    private addTraceContext;
    getServiceFor<S extends Node<S>, V extends NodeService<S>>(cls: ClassType<S> | string): V;
    getServiceForDbModel(dbClass: Model): SequelizeBaseServiceInterface<any, any, any, any, any, any>;
    newTransaction(params: {
        parentTransaction?: NodeServiceTransaction;
        isolation: NodeServiceIsolationLevel;
        autocommit: boolean;
        type?: NodeServiceTransactionType;
    }): Promise<NodeServiceTransaction>;
    endTransaction(transaction: NodeServiceTransaction, action: 'commit' | 'rollback'): Promise<void>;
    convertServiceOptionsToSequelizeOptions(options?: NodeServiceOptions): {
        paranoid?: boolean;
        transaction?: Transaction;
        lock?: LOCK;
    };
    getAll(filterBy: TFilter, options?: NodeServiceOptions): Promise<TConnection>;
    findOne(filterBy: TFilter, options?: NodeServiceOptions): Promise<TApi | undefined>;
    findEach(filterBy: TFilter, apply: (gqlObj: TApi, options?: NodeServiceOptions) => Promise<boolean>, options?: NodeServiceOptions): Promise<void>;
    count(filterBy: TFilter, options?: NodeServiceOptions): Promise<number>;
    getOne(oid: Oid, options?: NodeServiceOptions): Promise<TApi>;
    /**
     * Authorization on create is against the createInput object OR via the resolver
     * implementation that then overides the default check through skipAuthorization set on
     * nodeServices object
     *
     * If a more sophisticated mechanism is needed, then this method should be overridden
     * in the concreate class
     *
     * @param createInput Parameters to use for input
     * @param options
     */
    create(createInput: TInput, uncloned_options?: NodeServiceOptions): Promise<TApi>;
    /**
     * Runs an autyhroization query to see if the requested action  is allowed based
     * on the users permissions
     * @param oid
     * @param action
     * @param options
     */
    checkDbIsAuthorized(id: string | number, action: Actions, sequelizeOptions: FindOptions, options?: NodeServiceOptions): Promise<boolean>;
    /**
     *
     * Updates with data dependant authorizations require a check on the before data and a
     * check on the after data. For the update to be successful, both checks must suceed.
     *
     * Authorization check for updates:
     *   Check option to skip authorization
     *      else
     *   If not skipped, the update start a (nested) transaction
     *    re-read with Action.UPDATE permission matrix to see if you can update the version in the db.
     *    make the update
     *    re-read again with the permissions for Actions.update.
     *      if the object is not retrievable, it means that the update is not allowed, and the
     *         transaction is rolled back and an exception thrown.
     *
     *
     *
     * @param updateInput - data to uipdate
     * @param options - may include a transaction
     * @param target - if it does... then the prel  oaded Object loaded in that transaction should be passed in
     */
    update(updateInput: TUpdate, options?: NodeServiceOptions, target?: TApi): Promise<TApi>;
    getAssociatedMany<TAssocApi extends Node<TAssocApi>, TAssocConnection extends Connection<TAssocApi>, TAssocEdge extends Edge<TAssocApi>>(source: TApi, assoc_key: string, filterBy: RelayFilterBase<TAssocApi>, assocApiClass: ClassType<TAssocApi>, assocEdgeClass: ClassType<TAssocEdge>, assocConnectionClass: ClassType<TAssocConnection>, options?: NodeServiceOptions): Promise<TAssocConnection>;
    getAssociated<TAssocApi extends Node<TAssocApi>>(source: TApi, assoc_key: string, assocApiClass: ClassType<TAssocApi>, options?: NodeServiceOptions): Promise<TAssocApi | undefined>;
    private makeEdge;
    /**
     *
     * @param oid
     * @returns the data base id for the oid
     * @throws { InvalidOidError } if the Oid is for a different NodeService implementation
     */
    private getDbIdFor;
}
