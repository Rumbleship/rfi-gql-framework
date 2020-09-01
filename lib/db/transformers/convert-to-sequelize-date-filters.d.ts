/**
 * Processes a filter passed in by the framework and converts
 * @param filter An object that may contain properties matching *_between
 */
export declare function convertToSequelizeDateFilters<T extends Record<string, any>>(filter: T, date_suffix: string, range_suffix: string): T;
