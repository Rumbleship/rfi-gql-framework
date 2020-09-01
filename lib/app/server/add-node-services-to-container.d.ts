import { ContainerInstance } from 'typedi';
import { NodeService, Node } from '../../gql/relay';
import { RumbleshipContext } from '../rumbleship-context';
export declare function addNodeServicesToContainer(context: RumbleshipContext, container: ContainerInstance, nodeServices: NodeServiceMap<string>): void;
export declare type NodeServiceMap<TServiceName extends string = string> = Partial<Record<TServiceName, NodeService<Node<unknown>>>>;
