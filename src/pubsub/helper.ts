import * as os from 'os';
// in separate file to avoid circular dep
import { PubSubEngine } from 'type-graphql';
import { Sequelize } from 'sequelize-typescript';

const PubSubKey = Symbol('PubSubEngine');

/*
export function attachPubSubEngineToSequelize(pubSub: PubSubEngine, sequelize: Sequelize): void {
  Reflect.set(sequelize, PubSubKey, pubSub);
}
export function pubSubFrom(sequelize: Sequelize): PubSubEngine | null {
  const pubSub = Reflect.get(sequelize, PubSubKey);
  return pubSub ? pubSub : null;
}
*/

function randint(min: number, max: number): number{
  const diff: number = max - min;
  return Math.floor(Math.random() * Math.floor(diff)) + min;
}

function randchar(): number { // not technically a char as name implies
  return randint(97, 122); // a-z
}

function randstr(len: number) {
  return String.fromCharCode(...Array.from(new Array(len), randchar));
}

export function uniqueSubscriptionNamePart() {
  return '' + os.hostname() + '-' + randstr(6);
}
