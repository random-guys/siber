import joi, { SchemaMap } from '@hapi/joi';
import dotenv from 'dotenv';
import mapKeys from 'lodash/mapKeys';
import { parseError } from './validate';

/**
 * Load process environment and validate the keys needed. Do make sure you
 * specify every key you plan to use in the schema as it removes unknown
 * keys.
 * @param schema schema to use for validation
 */
export function autoloadEnv<T extends SiberConfig>(schema: SchemaMap): T {
  dotenv.config();
  const processedEnv = mapKeys(process.env, (_, key) => {
    return key.toLowerCase();
  });

  return validateConfig(processedEnv, schema);
}

/**
 * Validate an env object using the schema. It'll throw an error if such
 * validation fails, but return the parsed value otherwise. Note that it
 * removes unspecified keys
 * @param data env object
 * @param schema schema to use for validation
 */
function validateConfig<T extends SiberConfig>(
  data: any,
  schema: SchemaMap
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

/**
 * Basic configuration used by all services
 */
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

/**
 * Creates an actual object schema and ensures `node_env`
 * becomes `app_env`
 * @param schema map of keys to schemas
 */
export function siberConfig(schema: SchemaMap) {
  return joi.object(schema).rename('node_env', 'app_env');
}

/**
 * Creates a field that becomes required when `NODE_ENV != dev`.
 */
export function optionalForDev() {
  return joi.when('node_env', {
    is: joi.valid('dev'),
    then: joi.string().required(),
    otherwise: joi.string()
  });
}

/**
 * Schema for validating mongo configuration
 */
export const mongoConfig = {
  mongodb_url: joi.string().required(),
  mongodb_username: optionalForDev(),
  mongodb_password: optionalForDev()
};

export interface SiberConfig {
  /**
   * Help API clients choose
   */
  api_version: string;
  /**
   * Eqivalent to `NODE_ENV`
   */
  app_env: string;
  /**
   * What port number to serve the app
   */
  port: number;
  /**
   * 32 char string to be used for sessions and seals
   */
  service_secret: string;
}
