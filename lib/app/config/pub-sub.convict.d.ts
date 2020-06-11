export interface RfiPubSubConfig {
    keyFilename: string;
    topicPrefix: string;
    resetHostedSubscriptions: boolean;
}
export declare const PubSubConfig: {
    keyFilename: {
        doc: string;
        format: StringConstructor;
        default: string;
        env: string;
    };
    topicPrefix: {
        doc: string;
        format: StringConstructor;
        default: string | undefined;
        env: string;
    };
    resetHostedSubscriptions: {
        doc: string;
        format: BooleanConstructor;
        default: boolean;
        env: string;
    };
};
