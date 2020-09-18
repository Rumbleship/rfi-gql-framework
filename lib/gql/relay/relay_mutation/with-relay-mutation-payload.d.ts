import { ClassType } from '../../../helpers';
export declare function withRelayMutationPayload<TInput extends ClassType<Record<string, any>>>(Base: TInput): {
    new (...args: any[]): {
        [x: string]: any;
        clientMutationId?: string | undefined;
    };
} & TInput;
