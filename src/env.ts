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

function validateConfig<T extends SiberConfig>(
  data: any,
  schema: SchemaLike
): T {
  const { error, value } = joi.validate(data, schema, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    throw new Error(`Unable to validate configuration: ${parseError(error)}`);
  }

  return value;
}

const basicSiberConfig = {
  api_version: joi.string().default('/api/v1'),
  node_env: joi
    .string()
    .valid('dev', 'production', 'staging')
    .default('dev'),
  port: joi.number().required(),
  service_secret: joi
    .string()
    .required()
    .min(32)
};

export interface SiberConfig {
  api_version: string;
  app_env: string;
  port: number;
  service_secret: string;
}
