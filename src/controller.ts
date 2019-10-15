import {
  DuplicateModelError,
  ModelNotFoundError,
  Query
} from '@random-guys/bucket';
import '@random-guys/express-jsend'; // jSend type def
import Logger from 'bunyan';
import { Request, Response } from 'express';
import HttpStatus from 'http-status-codes';
import { injectable, unmanaged } from 'inversify';
import pick from 'lodash/pick';
import { ConstraintDataError } from './errors';
import { IrisAPIError, IrisError, IrisServerError } from '@random-guys/iris';

@injectable()
export class Controller<T> {
  constructor(@unmanaged() private logger: Logger) {}

  /**
   * Determines the HTTP status code of an error
   * @param err Error object
   */
  getHTTPErrorCode(err: any) {
    // check if error code exists and is a valid HTTP code.
    if (err.code && (err.code as number).toString().length === 3)
      return err.code;
    if (err instanceof ModelNotFoundError) return HttpStatus.NOT_FOUND;
    if (err instanceof DuplicateModelError) return HttpStatus.CONFLICT;
    if (err instanceof IrisAPIError) return err.data.code;
    if (err instanceof IrisError)
      return /timeout/.test(err.message)
        ? HttpStatus.GATEWAY_TIMEOUT
        : HttpStatus.BAD_GATEWAY;

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  /**
   * Safely run the handler converting any error to a JSEND error and
   * any ensuring a Controller response T is returned.
   * @param req request object from express
   * @param res response object from express
   * @param handler function that returnes a response T
   */
  async safely(req: Request, res: Response, handler: () => Promise<T>) {
    try {
      this.handleSuccess(req, res, await handler());
    } catch (err) {
      if (err instanceof ConstraintDataError) {
        this.handleError(req, res, err, err.data);
      } else {
        this.handleError(req, res, err);
      }
    }
  }

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
   * Handles operation error and sends a HTTP response
   * @param req Express request
   * @param res Express response
   * @param error Error object
   */
  handleError(req: Request, res: Response, err: Error, data?: any) {
    // useful when we have call an asynchrous function that might throw
    // after we've sent a response to client
    if (res.headersSent) return this.logger.error(err);

    if (err instanceof ConstraintDataError) {
      data = err.data;
    }

    if (err instanceof IrisAPIError) {
      data = err.data.data;
      err.message = err.data.message;
    }

    if (err instanceof IrisServerError) {
      err.message = 'We are having internal issues. Please bear with us';
    }

    res.jSend.error(data, err.message, this.getHTTPErrorCode(err));
    this.logger.error({ err, res, req });
  }

  /**
   * Picks relevant pagination options from an Express query object
   * @param query Express Query object
   */
  getPaginationOptions(query: any): PaginationOptions {
    return pick(query, ['page', 'per_page', 'projections', 'sort']);
  }
}

export type PaginationOptions = Pick<
  Query,
  Exclude<keyof Query, 'conditions' | 'archived'>
>;
