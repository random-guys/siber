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
  corsDomains?: string | string[];
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

  /**
   * Controls the maximum request body size.
   */
  requestBodyLimit?: number
}

/**
 * Configure an express application with:
 * - JSON/URLEncoded request parsing
 * - JSend methods for requests
 * - Request Logging and response time tracking
 * - CORS
 * @param app express application to configure
 * @param logger logger for request logging
 * @param conf siber configuration
 */
export function build(
  app: Application,
  logger: Logger,
  conf: SiberConfig = {}
) {
  // default middleware
  app.use(express.json({ limit: conf.requestBodyLimit }));
  app.use(express.urlencoded({ extended: false }));
  app.use(refreshJSend);

  conf.excludeAgents = conf.excludeAgents ?? [];
  if (!conf.logKubernetes) {
    conf.excludeAgents.push(...kubernetesAgents);
  }

  app.use(requestTracker(logger, conf.excludeAgents));
  app.use(responseTime());

  // CORS
  if (conf.corsDomains) {
    const domains = Array.isArray(conf.corsDomains)
      ? conf.corsDomains
      : [conf.corsDomains];

    const corsConf = {
      origin: [/localhost/, ...domains.map(domain => new RegExp(`${domain}$`))],
      credentials: true
    };

    app.use(cors(corsConf));
    app.options("*", cors(corsConf));
  }
}
