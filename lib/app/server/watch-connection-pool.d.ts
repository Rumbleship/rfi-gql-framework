import { Sequelize } from 'sequelize/types';
export declare function traceConnection(action: 'beforeConnect' | 'afterConnect' | 'afterDisconnect' | 'beforeDisconnect', sequelize: Sequelize, connection?: Record<string, any>, config?: Record<string, any>): Promise<void>;
export declare function attachConnectionHooks(): void;
