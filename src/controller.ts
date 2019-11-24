import { Query } from "@random-guys/bucket";
import Logger from "bunyan";
import { Request, Response } from "express";
import { injectable, unmanaged } from "inversify";
import pick from "lodash/pick";
import { Chunk, sendChunks } from "./chunks";

@injectable()
export class Controller<T> {
  constructor(@unmanaged() private logger: Logger) {}

  async sendAllChunks(req: Request, res: Response, chunks: Chunk<T>[]) {
    sendChunks(this.logger, req, res, chunks);
  }

  /**
   * Handles operation success and sends a HTTP response.
   * __Note__: if the data passed is a promise, no value is sent
   * until the promise resolves.
   * @param req Express request
   * @param res Express response
   * @param data Success data
   */
  async handleSuccess(req: Request, res: Response, data: T | Promise<T>) {
    res.jSend.success(await data);
    this.logger.info({ req, res });
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
