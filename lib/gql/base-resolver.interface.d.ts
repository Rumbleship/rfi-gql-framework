import { Connection } from './connection.type';
import { RumbleshipContext } from './../server/rumbleship-context';
import { Node } from './node.interface';
export interface BaseReadOnlyResolverInterface<TApi extends Node<TApi>, TConnection extends Connection<TApi>, TFilter> {
    ctx: RumbleshipContext;
    getAll(filterBy: TFilter): Promise<TConnection>;
    getOne(id: string): Promise<TApi>;
}
export interface BaseWritableResolverInterface<TApi extends Node<TApi>, TInput, TUpdate> {
    ctx: RumbleshipContext;
    create(input: TInput): Promise<TApi>;
    update(input: TUpdate): Promise<TApi>;
}
export interface BaseResolverInterface<TApi extends Node<TApi>, TConnection extends Connection<TApi>, TFilter, TInput, TUpdate> extends BaseReadOnlyResolverInterface<TApi, TConnection, TFilter>, BaseWritableResolverInterface<TApi, TInput, TUpdate> {
}
