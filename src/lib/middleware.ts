import { ILogger, logRequest } from "@random-guys/express-bunyan";
import { refreshJSend } from "@random-guys/express-jsend";
import cors from "cors";
import express, { Application } from "express";
import responseTime from "response-time";
import { SiberConfig } from "./contracts";
import { getConfig } from "./cors";


export default function buildInto(app: Application, logger: ILogger, conf: SiberConfig) {
  // default middleware
  app.use(express.json())
  app.use(express.urlencoded({ extended: false }))

  // CORS
  if (conf.cors) {
    const corsConfig = getConfig(conf.cors)
    app.use(cors(corsConfig))
    app.options('*', cors(corsConfig))
  }

  // logging and metrics
  if (conf.tracking) {
    app.use(logRequest(logger))
    app.use(responseTime())
  }

  // jsend standard
  if (conf.jsend) {
    app.use(refreshJSend)
  }
}