export const FilterableIdSymbol = Symbol('FilterableIdSymbol');
export function FilterableId(target: object, property_name: string) {
  Reflect.defineMetadata(FilterableIdSymbol, true, target, property_name);
}
export function isFilterableId(filter: any, property_name: string | symbol): boolean {
  if (Reflect.hasMetadata(FilterableIdSymbol, filter, property_name)) {
    return true;
  }
  return false;
}
