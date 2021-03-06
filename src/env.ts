import { MongoConfig } from "@random-guys/bucket";
import dotenv from "dotenv";
import joi, { ObjectSchema, SchemaMap, ValidationError } from "joi";
import mapKeys from "lodash/mapKeys";
import { parseError } from "./validate";

const trimmedString = joi.string().trim();
const trimmedRequiredString = trimmedString.required();

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
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    // TODO: what is this?? find a solution
    throw new IncompleteEnvError(error);
  }

  return value;
}

/**
 * Basic configuration used by all services
 */
const basicSiberConfig = {
  api_version: trimmedString.default("/api/v1"),
  auth_scheme: trimmedRequiredString,
  node_env: trimmedString
    .valid("dev", "test", "production", "staging")
    .default("dev"),
  is_production: joi.when("node_env", {
    is: joi.valid("dev", "test"),
    then: joi.boolean().default(false),
    otherwise: joi.boolean().default(true)
  }),
  port: joi.number().required(),
  service_name: trimmedRequiredString,
  service_secret: trimmedRequiredString.min(32)
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
  return joi.when("node_env", {
    is: joi.valid("production", "staging"),
    then: trimmedRequiredString,
    otherwise: trimmedString
  });
}

/**
 * Schema for validating mongo configuration
 */
export const mongoConfig = {
  mongodb_url: trimmedRequiredString,
  mongodb_username: optionalForDev(),
  mongodb_password: optionalForDev()
};

/**
 * Schema for validating redis configuration
 */
export const redisConfig = {
  redis_url: trimmedRequiredString,
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
   * True if `node_env` is `production` or `staging`
   */
  is_production: boolean;
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
  redis_password?: string;
}

/**
 * This is for apps that only need sessions
 */
export interface SessionedApp extends AppConfig, RedisConfig { }

/**
 * This is for apps that want the full package
 */
export interface DBApp extends SessionedApp, MongoConfig { }
