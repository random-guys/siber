import { logRequests } from "@random-guys/express-bunyan";
import { refreshJSend } from "@random-guys/express-jsend";
import Logger from "bunyan";
import cors from "cors";
import express, { Application } from "express";
import responseTime from "response-time";
import { SiberConfig } from "./contracts";
import { getConfig } from "./cors";


export default function buildInto(app: Application, logger: Logger, conf: SiberConfig) {
  // default middleware
  app.use(express.json())
  app.use(express.urlencoded({ extended: false }))

  // CORS
  if (conf.cors) {
    const corsConfig = getConfig(conf.cors)
    app.use(cors(corsConfig))
    app.options('*', cors(corsConfig))
  }

  // jsend standard
  if (conf.jsend) {
    app.use(refreshJSend)
  }

  // logging and metrics
  if (conf.tracking) {
    app.use(logRequests(logger))
    app.use(responseTime())
  }
}