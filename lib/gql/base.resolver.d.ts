import { RelayService, Node, Connection } from './index';
import { ClassType } from '../helpers/classtype';
import { GqlNodeNotification } from './node-notification';
export declare class GQLBaseResolver<TApi extends Node<TApi>, TConnection extends Connection<TApi>, TFilter, TInput, TUpdate> {
    protected service: RelayService<TApi, TConnection, TFilter, TInput, TUpdate>;
    constructor(service: RelayService<TApi, TConnection, TFilter, TInput, TUpdate>);
    getAll(filterBy: TFilter): Promise<TConnection>;
    getOne(id: string): Promise<TApi>;
    create(input: TInput): Promise<TApi>;
    update(input: TUpdate): Promise<TApi>;
}
export declare function createBaseResolver<TApi extends Node<TApi>, TConnection extends Connection<TApi>, TFilter, TInput, TUpdate, TNotification extends GqlNodeNotification<TApi>>(baseName: string, objectTypeCls: ClassType<TApi>, connectionTypeCls: ClassType<TConnection>, filterClsType: ClassType<TFilter>, inputClsType: ClassType<TInput>, updateClsType: ClassType<TUpdate>, notificationClsType: ClassType<TNotification>): ClassType<GQLBaseResolver<TApi, TConnection, TFilter, TInput, TUpdate>>;
