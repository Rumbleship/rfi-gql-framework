import { ISharedSchema } from '@rumbleship/config';
import { BaseResolverInterface } from '../../../gql/resolvers/base-resolver.interface';
import { Webhook, WebhookConnection, WebhookFilter, WebhookInput, WebhookUpdate } from './webhook.relay';
import { ClassType } from '../../../helpers';
import { Empty } from '../../../gql/relay/relay_mutation';
import { QueuedSubscriptionRequestInput, WebhookSubscription } from '../../queued_subscription_request/gql';
declare const AddWebhookPayload_base: {
    new (...args: any[]): {
        [x: string]: any;
        clientMutationId?: string | undefined;
    };
} & typeof Empty;
export declare class AddWebhookPayload extends AddWebhookPayload_base {
    webhook: Webhook;
}
declare const AddWebhookInput_base: {
    new (...args: any[]): {
        [x: string]: any;
        clientMutationId?: string | undefined;
    };
} & typeof Empty;
export declare class AddWebhookInput extends AddWebhookInput_base {
    system_id: string;
    subscription_url: string;
}
declare const RemoveWebhookPayload_base: {
    new (...args: any[]): {
        [x: string]: any;
        clientMutationId?: string | undefined;
    };
} & typeof Empty;
export declare class RemoveWebhookPayload extends RemoveWebhookPayload_base {
}
declare const AddSubscriptionInput_base: {
    new (...args: any[]): {
        [x: string]: any;
        clientMutationId?: string | undefined;
    };
} & typeof Empty;
export declare class AddSubscriptionInput extends AddSubscriptionInput_base implements Partial<QueuedSubscriptionRequestInput> {
    webhook_id: string;
    gql_query_string: string;
    query_attributes?: string;
    operation_name?: string;
    client_request_uuid: string;
    active: boolean;
}
declare const AddSubscriptionPayload_base: {
    new (...args: any[]): {
        [x: string]: any;
        clientMutationId?: string | undefined;
    };
} & typeof Empty;
export declare class AddSubscriptionPayload extends AddSubscriptionPayload_base {
    webhookSubscription: WebhookSubscription;
}
declare const RemoveSubscriptionInput_base: {
    new (...args: any[]): {
        [x: string]: any;
        clientMutationId?: string | undefined;
    };
} & typeof Empty;
export declare class RemoveSubscriptionInput extends RemoveSubscriptionInput_base {
    webhookId: string;
    subscriptionId: string;
}
declare const RemoveSubscriptionPayload_base: {
    new (...args: any[]): {
        [x: string]: any;
        clientMutationId?: string | undefined;
    };
} & typeof Empty;
export declare class RemoveSubscriptionPayload extends RemoveSubscriptionPayload_base {
    webhook: Webhook;
}
declare const RemoveWebhookInput_base: {
    new (...args: any[]): {
        [x: string]: any;
        clientMutationId?: string | undefined;
    };
} & typeof Empty;
export declare class RemoveWebhookInput extends RemoveWebhookInput_base {
    webhookId: string;
}
export declare function buildWebhookResolver(config: ISharedSchema): ClassType<BaseResolverInterface<Webhook, WebhookConnection, WebhookFilter, WebhookInput, WebhookUpdate>>;
export {};
