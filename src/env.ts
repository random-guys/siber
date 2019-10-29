import { MongoConfig } from '@random-guys/bucket';
import dotenv from 'dotenv';

dotenv.config();

export function autoloadEnv<T>(...keys: string[]): T {
  const envObject = dotenv.config();
  // @ts-ignore
  return envObject.parsed;
}
