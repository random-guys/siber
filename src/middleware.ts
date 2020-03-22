import Logger from "bunyan";
import cors, { CorsOptions } from "cors";
import express, { Application } from "express";
import responseTime from "response-time";
import { requestTracker } from "./logging";
import { refreshJSend } from "./jsend";

export interface SiberConfig {
  cors: boolean | CorsOptions;
  tracking: {
    excludeAgents?: RegExp[];
  };
}

export function build(app: Application, logger: Logger, conf: SiberConfig) {
  // default middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(refreshJSend);
  app.use(requestTracker(logger, conf.tracking.excludeAgents));
  app.use(responseTime());

  // CORS
  if (conf.cors) {
    if (typeof conf.cors === "boolean") {
      conf.cors = {
        origin: true,
        credentials: true
      };
    }

    app.use(cors(conf.cors));
    app.options("*", cors(conf.cors));
  }
}
