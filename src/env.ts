import { MongoConfig } from '@random-guys/bucket';
import dotenv from 'dotenv';
import joi from '@hapi/joi';
import mapKeys from 'lodash/mapKeys';

dotenv.config();

export function autoloadEnv<T>(...keys: string[]): T {
  const envObject = dotenv.config();

  // @ts-ignore
  return mapKeys(envObject.parsed, (_, key) => {
    return key.toLowerCase();
  });
}
