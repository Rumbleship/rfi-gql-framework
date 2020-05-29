import { ModelAttributeColumnOptions } from 'sequelize';
/**
 * Inspired by Plaid's API that considers adding values to Enums as non-breaking changes.
 *
 * We store the raw value as a string, and cast to our TypeScript/GQL Enums on retrieval from DB
 */
export declare function ExtensibleEnumColumn<T extends object>(target_enum: T, options?: Pick<ModelAttributeColumnOptions, 'allowNull'>): (target: object, property_name: string) => any;
