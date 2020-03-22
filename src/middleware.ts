import Logger from "bunyan";
import cors, { CorsOptions } from "cors";
import express, { Application } from "express";
import responseTime from "response-time";
import { requestTracker } from "./logging";
import { refreshJSend } from "./jsend";

const kubernetesAgents = [/kube-probe/i, /Prometheus/i];

export interface SiberConfig {
  /**
   * domains beyond localhost, that can make CORS requests to this service(
   * even with credentials). Note that without this cors would be disabled entirely
   */
  cors_domains?: string | string[];
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
  if (conf.cors_domains) {
    const domains = Array.isArray(conf.cors_domains)
      ? conf.cors_domains
      : [conf.cors_domains];

    const corsConf = {
      origin: [/localhost/, ...domains.map(domain => new RegExp(`${domain}$`))],
      credentials: true
    };

    app.use(cors(corsConf));
    app.options("*", cors(corsConf));
  }
}
