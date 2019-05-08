import { Model } from 'sequelize-typescript';
import { NodeService } from '../gql/relay.service';
import { Node } from '../gql/index';
import { ClassType } from '../helpers/classtype';
export declare const modelKey: unique symbol;
export declare const apiKey: unique symbol;
export declare function modelToClass<T extends Node<T>, V extends Model<V>>(nodeService: NodeService<T>, to: ClassType<T>, from: V): T;
export declare function convertToSequelizeEnum<TEnum>(toConvert: TEnum, options?: {
    exclude: string[];
}): import("sequelize/types").EnumDataType<string>;
