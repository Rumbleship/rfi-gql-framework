export const FilterableIdSymbol = Symbol('FilterableIdSymbol');
export function FilterableId(options: object = {}): PropertyDecorator {
  return (target_class, property_name) => {
    const list: Array<string | symbol> =
      Reflect.getMetadata(FilterableIdSymbol, target_class) ?? [];
    list.push(property_name);
    Reflect.defineMetadata(FilterableIdSymbol, list, target_class);
  };
}
export function isFilterableId(filter: any, property_name: string | symbol): boolean {
  const list = Reflect.getMetadata(FilterableIdSymbol, filter) ?? [];
  if (list.includes(property_name)) {
    return true;
  }
  return false;
}
