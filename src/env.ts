import joi, { SchemaLike } from '@hapi/joi';
import dotenv from 'dotenv';
import mapKeys from 'lodash/mapKeys';
import { parseError } from './validate';

dotenv.config();

export function autoloadEnv<T extends SiberConfig>(schema: SchemaLike): T {
  dotenv.config();
  const processedEnv = mapKeys(process.env, (_, key) => {
    return key.toLowerCase();
  });

  return validateConfig(processedEnv, schema);
}

export function validateConfig<T>(data: any, schema: SchemaLike): T {
  const { error, value } = joi.validate(data, schema, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    throw new Error(`Unable to validate configuration: ${parseError(error)}`);
  }

  return value;
}
