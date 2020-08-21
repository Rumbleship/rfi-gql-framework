import { DocumentNode } from 'graphql';
export interface GqlExecutionParams {
    query: DocumentNode;
    variables?: {
        [key: string]: any;
    };
    operationName?: string;
}
