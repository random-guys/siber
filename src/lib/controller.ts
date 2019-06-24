import { DuplicateModelError, ModelNotFoundError } from '@random-guys/bucket';
import { ILogger } from '@random-guys/express-bunyan';
import '@random-guys/express-jsend'; // jSend type def
import { Request, Response } from 'express';
import HttpStatus from 'http-status-codes';
import { injectable, unmanaged } from 'inversify';
import pick from 'lodash/pick';
import { ConstraintDataError } from './errors';
import { PaginationOptions } from './types';


@injectable()
export class Controller<T> {

  constructor(@unmanaged() private readonly logger: ILogger) { }

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
    this.logger.logAPIResponse(req, res);
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
      data = err.data
    }

    res.jSend.error(data, err.message, this.getHTTPErrorCode(err));
    this.logger.logAPIError(req, res, err);
  }

  /**
   * Picks relevant pagination options from an Express query object
   * @param query Express Query object
   */
  getPaginationOptions(query: any): PaginationOptions {
    return pick(query, ['page', 'per_page', 'projections', 'sort']);
  }
}
