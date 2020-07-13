import 'reflect-metadata';
import { RelayFilterBase } from './relay.interface';
import { FieldOptions } from 'type-graphql';
export declare function AliasFromDeprecatedField(deprecated_prop_name: symbol | string, field_options: FieldOptions): PropertyDecorator;
export declare function stripDeprecatedFieldsFromFilter<T extends RelayFilterBase<any>>(filter: T): T;
