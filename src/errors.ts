import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status-codes';
import { IrisAPIError, IrisServerError } from '@random-guys/iris';
import Logger from 'bunyan';

export interface HttpError {
  readonly code: number;
}

export interface HttpDataError extends HttpError {
  readonly data: any;
}

export class ControllerError extends Error implements HttpError {
  code: number;
  constructor(message: string) {
    super(message);
  }
}

export class ServerError extends ControllerError {
  code: number;
  constructor(message: string) {
    super(message);
    this.code = HttpStatus.INTERNAL_SERVER_ERROR;
  }
}

export class ActionNotAllowedError extends ControllerError {
  constructor(message: string) {
    super(message);
    this.code = HttpStatus.BAD_REQUEST;
  }
}

export class BadGatewayError extends ControllerError {
  constructor(message: string) {
    super(message);
    this.code = HttpStatus.BAD_GATEWAY;
  }
}

export class UnavailableGatewayError extends ControllerError {
  constructor(message: string) {
    super(message);
    this.code = HttpStatus.GATEWAY_TIMEOUT;
  }
}

export class NotFoundError extends ControllerError {
  constructor(message: string) {
    super(message);
    this.code = HttpStatus.NOT_FOUND;
  }
}

export class ConstraintError extends ControllerError {
  constructor(message: string) {
    super(message);
    this.code = HttpStatus.UNPROCESSABLE_ENTITY;
  }
}

export class ConstraintDataError extends ControllerError
  implements HttpDataError {
  data: any;
  code = HttpStatus.UNPROCESSABLE_ENTITY;
  constructor(message: string, data: any) {
    super(message);
    this.data = data;
  }
}

export function defaultErrorHandler(req: Request, res: Response, err: Error, logger: Logger, data?: any) {
  // useful when we have call an asynchrous function that might throw
  // after we've sent a response to client
  if (res.headersSent) return logger.error(err);

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
  logger.error({ err, res, req });
}