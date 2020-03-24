import { Request, Response } from "express";
import client from "prom-client";
import { AppConfig } from "./env";

export class SiberMetrics {
  private histogram: client.Histogram<"method" | "statusCode" | "path">;

  constructor(config: AppConfig) {
    client.register.setDefaultLabels({
      service: config.service_name,
      environment: config.node_env
    });

    client.collectDefaultMetrics();

    this.histogram = new client.Histogram({
      name: "http_request_duration_seconds",
      help: "Duration of HTTP requests in seconds",
      labelNames: ["method", "statusCode", "path"]
    });
  }

  /**
   * HTTP Handler for sending prometheus metrics
   * @param req Express Request object
   * @param res Express response object
   */
  send(req: Request, res: Response) {
    res.set("Content-Type", client.register.contentType);
    res.end(client.register.metrics());
  }

  /**
   * Records a HTTP response
   * @param req Express request object
   * @param res Express response object
   */
  record(req: Request, res: Response) {
    const responseTimeHeader = <string>res.getHeader("X-Response-Time");
    const time = parseFloat(responseTimeHeader) / 1000;
    const url = `${req.baseUrl}${req.route.path}`;
    this.histogram
      .labels(req.method, String(res.statusCode), url)
      .observe(time);
  }
}
