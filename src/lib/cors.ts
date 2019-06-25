import { CORSConfig } from "./contracts";
import { CorsOptions } from "cors";

export function getConfig(conf: boolean | CORSConfig): CorsOptions {
  if (typeof conf === 'boolean') {
    conf = { cookies: false, mode: 'dev' }
  }

  const devMode = conf.mode === 'dev'
  if (!devMode && !conf.source)
    throw new Error('A source is required for production mode')

  return {
    origin: devMode ? true : conf.source,
    credentials: conf.cookies
  }
}