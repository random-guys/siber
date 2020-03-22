import Logger from "bunyan";
import cors, { CorsOptions } from "cors";
import express, { Application } from "express";
import responseTime from "response-time";
import { requestTracker } from "./logging";
import { refreshJSend } from "./jsend";

const kubernetesAgents = [/kube-probe/i, /Prometheus/i];

export interface SiberConfig {
  cors: boolean | CorsOptions;
  log_kubernetes?: boolean;
  tracking: {
    excludeAgents?: RegExp[];
  };
}

export function build(app: Application, logger: Logger, conf: SiberConfig) {
  // default middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(refreshJSend);

  conf.tracking.excludeAgents = conf.tracking.excludeAgents ?? [];
  if (!conf.log_kubernetes) {
    conf.tracking.excludeAgents.push(...kubernetesAgents);
  }

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
