import { Query } from "@random-guys/bucket";
import Logger from "bunyan";
import { EventEmitter } from "events";
import { Request, Response } from "express";
import { injectable, unmanaged } from "inversify";
import pick from "lodash/pick";
import { Chunk, proxy, sendChunks } from "./chunks";
import { SiberMetrics } from "./metrics";

@injectable()
export class Controller<T> {
  constructor(
    @unmanaged() private logger: Logger,
    @unmanaged() private metrics?: SiberMetrics
  ) {}

  /**
   * Send a list of `Chunk`(promise of value) using SSE
   * @param req express request
   * @param res express response
   * @param chunks list of chunks
   */
  async sendAllChunks(req: Request, res: Response, chunks: Chunk<T>[]) {
    sendChunks(this.logger, req, res, chunks);
  }

  /**
   * Proxy events from an event emitter to a client using SSE
   * @param req express Request
   * @param res express Response
   * @param emitter the event emitter to listen on
   * @param eventMap map of source events to destination events
   */
  proxyFrom(
    req: Request,
    res: Response,
    emitter: EventEmitter,
    eventMap: object
  ) {
    return proxy(this.logger, req, res, emitter, eventMap);
  }

  /**
   * Handles operation success and sends a HTTP response.
   * __Note__: if the data passed is a promise, no value is sent
   * until the promise resolves.
   * @param req Express request
   * @param res Express response
   * @param data Success data
   */
  async handleSuccess(req: Request, res: Response, data: T) {
    res.jSend.success(data);
    this.logger.info({ req, res });
    this.metrics.record(req, res);
  }

  /**
   * Picks relevant pagination options from an Express query object
   * @param query Express Query object
   */
  getPaginationOptions(query: any): PaginationOptions {
    return pick(query, ["page", "per_page", "projections", "sort"]);
  }
}

export type PaginationOptions = Pick<
  Query,
  Exclude<keyof Query, "conditions" | "archived">
>;
