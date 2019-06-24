import { ILogger, logRequest } from "@random-guys/express-bunyan";
import { refreshJSend } from "@random-guys/express-jsend";
import cors from "cors";
import express, { RequestHandler } from "express";
import responseTime from "response-time";

export interface SiberConfig {
  cors: boolean | CORSConfig
  jsend: boolean
  tracking: boolean
}

export interface CORSConfig {
  cookies: boolean
  source?: string
  mode: 'dev' | 'prod'
}

export default function siber(logger: ILogger, conf: SiberConfig) {
  // default middleware
  const middleware: any = [
    express.json(),
    express.urlencoded({ extended: false })
  ]

  // setup CORS
  if (conf.cors) {
    if (typeof conf.cors === 'boolean') {
      conf.cors = { cookies: false, mode: 'dev' }
    }
    middleware.push(createCORSMiddleware(conf.cors))
  }

  // setup logging and metrics
  if (conf.tracking) {
    middleware.unshift(
      logRequest(logger),
      responseTime()
    )
  }

  // setup jsend
  if (conf.jsend) {
    middleware.unshift(refreshJSend)
  }
  return middleware
}

function createCORSMiddleware(config: CORSConfig) {
  const origin = config.mode === 'dev' ? true : config.source
  const corsConf = { origin, credentials: config.cookies }
  const m = cors(corsConf)
  const options: RequestHandler = (req, res, next) => {
    if (req.method === 'OPTIONS') {
      return m(req, res, next)
    }
    next()
  }
  return [m, options]
}