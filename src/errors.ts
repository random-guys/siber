import { DuplicateModelError, ModelNotFoundError } from "@random-guys/bucket";
import { IrisAPIError, IrisServerError } from "@random-guys/iris";
import Logger from "bunyan";
import { NextFunction, Request, RequestHandler, Response } from "express";
import HttpStatus from "http-status-codes";

export class ControllerError extends Error {
  code: number;
  constructor(message: string) {
    super(message);
  }
}

export class ServerError extends ControllerError {
  constructor(message: string) {
    super(message);
    this.code = HttpStatus.INTERNAL_SERVER_ERROR;
  }
}

export class ForbiddenError extends ControllerError {
  constructor(message: string) {
    super(message);
    this.code = HttpStatus.FORBIDDEN;
  }
}

export class BadRequestError extends ControllerError {
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

export class GatewayTImeoutError extends ControllerError {
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

export class ConstraintDataError extends ControllerError {
  readonly data: any;
  code = HttpStatus.UNPROCESSABLE_ENTITY;
  constructor(message: string, data: any) {
    super(message);
    this.data = data;
  }
}

export function getHTTPErrorCode(err: any) {
  // check if error code exists and is a valid HTTP code.
  if (err.code >= 100 && err.code < 600) return err.code;

  // integration with bucket
  if (err instanceof ModelNotFoundError) return HttpStatus.NOT_FOUND;
  if (err instanceof DuplicateModelError) return HttpStatus.CONFLICT;

  // integration with iris
  if (err instanceof IrisAPIError) return err.data.code;
  if (err instanceof IrisServerError)
    return /timeout/.test(err.message)
      ? HttpStatus.GATEWAY_TIMEOUT
      : HttpStatus.BAD_GATEWAY;

  return HttpStatus.INTERNAL_SERVER_ERROR;
}

export const universalErrorHandler = (
  err: any,
  logger: Logger
): RequestHandler => {
  // useful when we have call an asynchrous function that might throw
  // after we've sent a response to client
  return async (req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next(err);

    let data: any;
    const code = getHTTPErrorCode(err);

    if (err instanceof ConstraintDataError) {
      data = err.data;
    }

    if (err instanceof IrisAPIError) {
      data = err.data.data;
      err.message = err.data.message;
    }

    if (err instanceof IrisServerError || code === 500) {
      err.message = "We are having internal issues. Please bear with us";
    }

    res.jSend.error(data, err.message, code);
    logger.error({ err, res, req });
  };
};
