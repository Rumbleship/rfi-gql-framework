import 'reflect-metadata';
import { FieldOptions } from 'type-graphql';
export declare function AliasFromDeprecatedField(deprecated_prop_name: symbol | string, field_options: FieldOptions): PropertyDecorator;
export declare function TransposeDeprecatedFields(): ParameterDecorator;
