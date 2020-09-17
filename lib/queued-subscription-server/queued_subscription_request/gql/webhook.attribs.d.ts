import { AttribType } from '../../../gql/relay/attrib.enum';
import { ClassType } from '../../../helpers/classtype';
/**
 * Required because the builder needs to be correctly typed, as this is a library and
 * a .d.ts file is auytomatically created, which means the contents of the resultant classtype
 * returned needs to be explicit.
 *
 */
export interface WebhookBase {
    division_id: string;
    subscription_url: string;
    subscription_name: string;
    topic_name: string;
    active: boolean;
}
export declare function buildWebhookBaseAttribs(attribType: AttribType): ClassType<WebhookBase>;
