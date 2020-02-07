export interface RfiPubSubConfig {
    keyFilename: string;
    topicPrefex: string;
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
};
