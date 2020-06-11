import { Node } from '../gql';
import { RumbleshipContext } from '../server/rumbleship-context';
export interface RumbleshipResolver {
    ctx: RumbleshipContext;
    getOne: (id: string) => Promise<Node<any>>;
}
