import { Oid } from '@rumbleship/oid';
import { NodeService } from './relay.service';
export declare abstract class Node<T> {
    id: Oid;
    _service: NodeService<T>;
}
