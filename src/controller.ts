import {
  DuplicateModelError,
  ModelNotFoundError,
  Query
} from "@random-guys/bucket";
import Logger from "bunyan";
import { Request, Response } from "express";
import HttpStatus from "http-status-codes";
import { injectable, unmanaged } from "inversify";
import pick from "lodash/pick";
import { ConstraintDataError } from "./errors";
import { IrisAPIError, IrisServerError } from "@random-guys/iris";

@injectable()
export class Controller<T> {
  constructor(@unmanaged() private logger: Logger) {}

  /**
   * Handles operation success and sends a HTTP response
   * @param req Express request
   * @param res Express response
   * @param data Success data
   */
  handleSuccess(req: Request, res: Response, data: T) {
    res.jSend.success(data);
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
