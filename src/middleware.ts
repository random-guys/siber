import Logger from "bunyan";
import cors, { CorsOptions } from "cors";
import express, { Application } from "express";
import responseTime from "response-time";
import { requestTracker } from "./logging";
import { refreshJSend } from "./jsend";

const kubernetesAgents = [/kube-probe/i, /Prometheus/i];

export interface SiberConfig {
  cors: boolean | CorsOptions;
  /**
   * whether or not to log kube-proxy and prometheus user agents. Defaults
   * to false.
   */
  logKubernetes?: boolean;
  /**
   * agents to ignore when logging requests. Excludes kube-probe and Prometheus
   * unless `logKubernetes` is true.
   */
  excludeAgents?: RegExp[];
}

export function build(app: Application, logger: Logger, conf: SiberConfig) {
  // default middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use(refreshJSend);

  conf.excludeAgents = conf.excludeAgents ?? [];
  if (!conf.logKubernetes) {
    conf.excludeAgents.push(...kubernetesAgents);
  }

  app.use(requestTracker(logger, conf.excludeAgents));
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
