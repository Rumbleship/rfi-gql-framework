/**
 * see https://github.com/RobinBuschmann/sequelize-typescript/issues/487#issuecomment-442996094
 */
export type MixinType<T> = T extends new (...args: any[]) => infer R ? R : any;
