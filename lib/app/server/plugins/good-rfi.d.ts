import { ISharedSchema } from '@rumbleship/config';
import * as Hapi from '@hapi/hapi';
export declare const goodRfi: {
    name: string;
    register(server: Hapi.Server, server_config: ISharedSchema): Promise<void>;
};
