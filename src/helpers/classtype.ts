// tslint:disable-next-line
export type ClassType<T> = new (...args: any[]) => T;

// tslint:disable-next-line
export type ClassTypeWithStringConstructor<T> = new (arg: string) => T;
