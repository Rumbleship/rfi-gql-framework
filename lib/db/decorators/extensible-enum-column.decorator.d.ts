import { ModelAttributeColumnOptions } from 'sequelize';
/**
 * Inspired by Plaid's API that considers adding values to Enums as non-breaking changes.
 *
 * We store the raw value as a string, and cast to our TypeScript/GQL Enums on retrieval from DB
 *
 * If the raw value includes spaces, we replace them with `_` on retrieval from the db
 */
export declare function ExtensibleEnumColumn<T extends Record<string, any>>(target_enum: T, options?: Pick<ModelAttributeColumnOptions, 'allowNull'> & Pick<ModelAttributeColumnOptions, 'defaultValue'>): PropertyDecorator;
