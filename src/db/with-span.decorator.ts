import 'reflect-metadata';
export function WithSpan(context: object = {}): MethodDecorator {
  return (target: any, propertyName: string | symbol, descriptor: any) => {
    const originalMethod = descriptor.value;
    // NOTE: because the ctx is defined in the framework, this should probably be defined in the framework too
    // The framework should dependn on `@rumbleship/o11y` and then export WithSpan? That seems...ugly.
    // But better than making `@rumbleship/o11y` depend on the framework to get Context type?
    descriptor.value = function(...args: any[]) {
      // tslint:disable-next-line: no-console
      // inflect on the designtype metadata to do asyncspan vs span
      return this.ctx.rfiBeeline.withSpan(
        {
          ...context,
          'origin.type': 'decorator',
          'app.gql.resolve': originalMethod.name
        },
        () => originalMethod.apply(this, args)
      );
    };
  };
}
