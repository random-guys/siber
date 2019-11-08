import joi, { ObjectSchema, SchemaMap, ValidationError } from '@hapi/joi';
import dotenv from 'dotenv';
import mapKeys from 'lodash/mapKeys';
import { parseError } from './validate';

export class IncompleteEnvError extends Error {
  constructor(error: ValidationError) {
    const parsedError = parseError(error);

    super(
      `Unable to load environment:\n${JSON.stringify(parsedError, null, 2)}`
    );
  }
}

/**
 * Load process environment and validate the keys needed. Do make sure you
 * specify every key you plan to use in the schema as it removes unknown
 * keys.
 * @param schema schema to use for validation
 */
export function autoloadEnv<T extends AppConfig>(schema: ObjectSchema): T {
  dotenv.config();
  const processedEnv = mapKeys(process.env, (_, key) => {
    return key.toLowerCase();
  });

  return validateConfig(processedEnv, schema);
}

/**
 * Validate an env object using the schema. It'll exit the program if such
 * validation fails, but return the parsed value otherwise. Note that it
 * removes unspecified keys
 * @param data env object
 * @param schema schema to use for validation
 */
function validateConfig<T extends AppConfig>(
  data: any,
  schema: ObjectSchema
): T {
  const { error, value } = joi.validate(data, schema, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    // TODO: what is this?? find a solution
    throw new IncompleteEnvError(error);
  }

  // node_env hack
  if (value.node_env) {
    value.app_env = value.node_env;
  }

  return value;
}

/**
 * Basic configuration used by all services
 */
const basicSiberConfig = {
  api_version: joi.string().default('/api/v1'),
  auth_scheme: joi.string().required(),
  node_env: joi
    .string()
    .valid('dev', 'test', 'production', 'staging')
    .default('dev'),
  port: joi.number().required(),
  service_name: joi.string().required(),
  service_secret: joi
    .string()
    .required()
    .min(32)
};

/**
 * Creates an actual object schema with keys from `SiberConfig`
 * and ensures `node_env` becomes `app_env`
 * @param schema map of keys to schemas
 */
export function siberConfig(schema: SchemaMap) {
  return joi.object({ ...basicSiberConfig, ...schema });
}

/**
 * Creates a field that becomes required when `NODE_ENV != dev`.
 */
export function optionalForDev() {
  return joi.when('node_env', {
    is: joi.valid('production', 'staging'),
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

/**
 * Schema for validating redis configuration
 */
export const redisConfig = {
  redis_url: joi.string().required(),
  redis_password: optionalForDev()
};

export interface AppConfig {
  /**
   * Help API clients choose
   */
  api_version: string;
  /**
   * Eqivalent to `NODE_ENV`
   */
  node_env: string;
  /**
   * Alias to `node_env`
   */
  app_env: string;
  /**
   * Scheme for intersevice communication
   */
  auth_scheme: string;
  /**
   * What port number to serve the app
   */
  port: number;
  /**
   * 32 char string to be used for sessions and seals
   */
  service_secret: string;
  /**
   * Name of the service. This will appear in the logs
   */
  service_name: string;
}

export interface RedisConfig {
  /**
   * URL for redis
   */
  redis_url: string;
  /**
   * Password for authenticating with redis. Mostly on production/staging
   */
  redis_password: string;
}
