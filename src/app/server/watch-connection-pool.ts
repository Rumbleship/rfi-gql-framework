/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { addGaeVersionDataToTrace, RumbleshipBeeline } from '@rumbleship/o11y';
import { Sequelize } from 'sequelize/types';
import { v4 } from 'uuid';
import { getSequelizeInstance } from './init-sequelize';

export async function traceConnection(
  action: 'beforeConnect' | 'afterConnect' | 'afterDisconnect' | 'beforeDisconnect',
  sequelize: Sequelize,
  connection?: Record<string, any>,
  config?: Record<string, any>
): Promise<void> {
  const beeline = RumbleshipBeeline.make(v4());
  const [connection_variables] = await sequelize.query("show status like '%onn%';");
  const {
    authorized,
    compressedSequenceId,
    connectionId,
    connectTimeout,
    serverCompatibilityFlags,
    threadId
  } = connection ?? {};
  const variable: Record<string, any> = {};
  for (const row of connection_variables) {
    variable[(row as any).Variable_name] = (row as any).Value;
  }
  const traceIt = () => {
    const span = beeline.startSpan({
      name: 'sequelize.connection',
      db: {
        connection: {
          action,
          authorized,
          compressedSequenceId,
          connectionId,
          connectTimeout,
          serverCompatibilityFlags,
          threadId
        },
        variable
      }
    });
    addGaeVersionDataToTrace(() => beeline);
    beeline.finishSpan(span);
  };

  beeline.withTrace({ name: 'traceConnection' }, () => {
    traceIt();
  });
}

export function attachConnectionHooks(): void {
  const sequelize = getSequelizeInstance();
  sequelize?.addHook('beforeConnect', config =>
    traceConnection('beforeConnect', sequelize, {}, config)
  );
  sequelize?.addHook('afterConnect', (connection, config) =>
    traceConnection('afterConnect', sequelize, connection as Record<string, any>, config)
  );
  sequelize?.addHook('beforeDisconnect', connection =>
    traceConnection('beforeDisconnect', sequelize, connection as Record<string, any>)
  );
  sequelize?.addHook('afterDisconnect', connection =>
    traceConnection('afterDisconnect', sequelize, connection as Record<string, any>)
  );
}
