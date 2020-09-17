import { ClassType } from '../../../helpers';
export declare function withRelayMutationInput<TInputBase extends ClassType<Record<string, any>>>(Base: TInputBase): {
    new (...args: any[]): {
        [x: string]: any;
        clientMutationId?: string | undefined;
    };
} & TInputBase;
