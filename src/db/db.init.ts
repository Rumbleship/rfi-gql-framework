import { logging as spyglassLogging } from 'spyglass';
import { Sequelize } from 'sequelize-typescript';
import { BankAccountModel, PaymentRequestModel, BatchModel } from '../db';
import { config } from '../../config/config';
import { OrderReferenceModel } from '../models/order-reference.model';
import { ACHGatewayModel } from '../models/ach-gateway.model';
import { FinancialInstitutionModel } from '../models/financial-institution.model';
import { BankTransactionModel } from '../models/bank-transaction.model';

// add models here:-
// We don't use the matcher method for finding models as in typescript it can be awkward
// better to have an explicit list anyway IMHO: MH: 02/27/2019
const theModels = [
  FinancialInstitutionModel,
  BankAccountModel,
  PaymentRequestModel,
  BatchModel,
  OrderReferenceModel,
  ACHGatewayModel,
  BankTransactionModel
];

let theSequelizeInstance: Sequelize | null;

export function getSequelizeInstance(): Sequelize | null {
  return theSequelizeInstance;
}

export function nullSequelizeInstance() {
  theSequelizeInstance = null;
}

/**
 * initializes sequelize for the app and sets up a global sequelize
 * @param opt
 */
export async function initSequelize(opt?: {
  force: boolean;
  dbSuffix?: string;
}): Promise<Sequelize> {
  const force = opt ? opt.force : false;
  const dbSuffix = opt ? (opt.dbSuffix ? opt.dbSuffix : '') : '';
  const {
    db: { database, username, password, dialect, host, port, pool, socketPath, define }
  } = config;
  const db = database + dbSuffix;

  type loggingFun = (msg: string) => any;
  let logging: loggingFun | boolean = false;
  if (config.db.logging) {
    const logger = spyglassLogging.getLogger({ config });
    logging = (msg: string) => logger.debug(msg);
  }
  let options;
  if (socketPath) {
    options = {
      database: db,
      username,
      password,
      dialect,
      pool,
      logging,
      define,
      dialectOptions: { socketPath }
    };
  } else {
    options = {
      database: db,
      username,
      password,
      dialect,
      logging,
      define,
      host,
      port
    };
  }

  if (['test', 'development'].includes(process.env.NODE_ENV as string) && dbSuffix.length) {
    options.database = '';
    const temporarySequelize = new Sequelize(options);
    await temporarySequelize.query(`DROP DATABASE IF EXISTS ${db};`);
    await temporarySequelize.query(`CREATE DATABASE ${db};`);
    options.database = db;
  }
  theSequelizeInstance = new Sequelize(options);

  theSequelizeInstance.addModels(theModels);

  if (force) {
    await theSequelizeInstance.sync({ force });
  }
  return theSequelizeInstance;
}

// support for testing:
export async function resetAllTables(): Promise<void> {
  if (['test', 'development'].includes(process.env.NODE_ENV as string)) {
    if (theSequelizeInstance) {
      await theSequelizeInstance.sync({ force: true }); // force the tables to be dropped and recreated
    }
  }
}
