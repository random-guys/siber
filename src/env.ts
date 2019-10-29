import joi from '@hapi/joi';
import dotenv from 'dotenv';
import mapKeys from 'lodash/mapKeys';

dotenv.config();

export function autoloadEnv<T>(...keys: string[]): T {
  const envObject = dotenv.config();

  // @ts-ignore
  return mapKeys(envObject.parsed, (_, key) => {
    return key.toLowerCase();
  });
}

export const basicSiberConfig = {
  api_version: joi.string().default('/api/v1'),
  app_env: joi
    .string()
    .valid('dev', 'production', 'staging')
    .default('dev'),
  port: joi.number().required(),
  service_secret: joi
    .string()
    .required()
    .min(32)
};
