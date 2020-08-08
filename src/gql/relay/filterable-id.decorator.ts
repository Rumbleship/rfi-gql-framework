export const FilterableIdSymbol = Symbol('FilterableIdSymbol');
export function FilterableId(options: object = {}): PropertyDecorator {
  return (target_class: object, property_name: string | symbol) => {
    Reflect.defineMetadata(FilterableIdSymbol, true, target_class, property_name);
  };
}
export function isFilterableId(filter: any, property_name: string | symbol): boolean {
  if (Reflect.hasMetadata(FilterableIdSymbol, filter, property_name)) {
    return true;
  }
  return false;
}
