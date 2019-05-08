import { Model } from 'sequelize-typescript';
import { ClassType } from 'type-graphql';
export declare function validateFromExemplar<V extends Model<V>, T>(toValidate: V, exemplar: ClassType<T>): void;
