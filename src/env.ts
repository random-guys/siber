import joi from '@hapi/joi';
import dotenv from 'dotenv';
import mapKeys from 'lodash/mapKeys';

dotenv.config();

export function autoloadEnv<T extends SiberConfig>(schema: SchemaLike): T {
  // we don't use the return value because env might not contain all vars
  dotenv.config();
  const processedEnv = mapKeys(process.env, (_, key) => {
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
