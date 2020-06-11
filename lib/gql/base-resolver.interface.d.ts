import { Connection } from './connection.type';
import { RumbleshipContext } from './../server/rumbleship-context';
import { Node } from './node.interface';
export interface BaseResolverInterface<TApi extends Node<TApi>, TConnection extends Connection<TApi>, TFilter, TInput, TUpdate> {
    ctx: RumbleshipContext;
    getAll(filterBy: TFilter): Promise<TConnection>;
    getOne(id: string): Promise<TApi>;
    create(input: TInput): Promise<TApi>;
    update(input: TUpdate): Promise<TApi>;
}
