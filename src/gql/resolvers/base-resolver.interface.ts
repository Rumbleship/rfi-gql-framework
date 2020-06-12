import { RumbleshipContext } from '../../app/rumbleship-context';
import { Node, Connection } from '../relay';

export interface BaseReadableResolverInterface<
  TApi extends Node<TApi>,
  TConnection extends Connection<TApi>,
  TFilter
> {
  ctx: RumbleshipContext;
  getAll(filterBy: TFilter): Promise<TConnection>;
  getOne(id: string): Promise<TApi>;
}

export interface BaseWritableResolverInterface<TApi extends Node<TApi>, TInput, TUpdate> {
  ctx: RumbleshipContext;
  create(input: TInput): Promise<TApi>;
  update(input: TUpdate): Promise<TApi>;
}
export interface BaseResolverInterface<
  TApi extends Node<TApi>,
  TConnection extends Connection<TApi>,
  TFilter,
  TInput,
  TUpdate
>
  extends BaseReadableResolverInterface<TApi, TConnection, TFilter>,
    BaseWritableResolverInterface<TApi, TInput, TUpdate> {}
