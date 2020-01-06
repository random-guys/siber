import { DuplicateModelError, ModelNotFoundError } from "@random-guys/bucket";
import { IrisAPIError, IrisServerError } from "@random-guys/iris";
import Logger from "bunyan";
import { ErrorRequestHandler, NextFunction, Request, Response } from "express";
import HttpStatus from "http-status-codes";
import { Interpreter } from "./compose";

export class ControllerError extends Error {
  readonly code: number;
  constructor(message: string) {
    super(message);
  }
}

export class ServerError extends ControllerError {
  code = HttpStatus.INTERNAL_SERVER_ERROR;
  constructor(message: string) {
    super(message);
  }
}

export class ForbiddenError extends ControllerError {
  code = HttpStatus.FORBIDDEN;
  constructor(message: string) {
    super(message);
  }
}

export class BadRequestError extends ControllerError {
  code = HttpStatus.BAD_REQUEST;
  constructor(message: string) {
    super(message);
  }
}

export class BadGatewayError extends ControllerError {
  code = HttpStatus.BAD_GATEWAY;
  constructor(message: string) {
    super(message);
  }
}

export class GatewayTimeoutError extends ControllerError {
  code = HttpStatus.GATEWAY_TIMEOUT;
  constructor(message: string) {
    super(message);
  }
}

export class NotFoundError extends ControllerError {
  code = HttpStatus.NOT_FOUND;
  constructor(message: string) {
    super(message);
  }
}

export class ConstraintError extends ControllerError {
  code = HttpStatus.UNPROCESSABLE_ENTITY;
  constructor(message: string) {
    super(message);
  }
}

export class ConstraintDataError extends ControllerError {
  code = HttpStatus.UNPROCESSABLE_ENTITY;
  readonly data: any;
  constructor(message: string, data: any) {
    super(message);
    this.data = data;
  }
}

export class ConflictError extends ControllerError {
  code = HttpStatus.CONFLICT;
  constructor(message: string) {
    super(message);
  }
}

/**
 * Get the HTTP code for an error that has a prop `code`,or is a `bucket`error, or
 * a `iris` error. Returns `500` otherwise
 * @param err error to parse
 */
export function isInvalidHTTPCode(err: any) {
  // check if error code exists and is a valid HTTP code.
  if (err.code < 100 || err.code > 600) return err.code;

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

/**
 * A global error handler for an entire app. If the error passed is an instance
 * of `ControllerError` it will return its correpsonding code, otherwise it returns
 * `500` and logs the original error
 * @param logger Logger to log errors and their corresponding
 * request/response pair
 * @param interpreter function to convert errors form libraries
 * into `ControllerError`
 */
export function universalErrorHandler(
  logger: Logger,
  interpreter?: Interpreter
): ErrorRequestHandler {
  // useful when we have call an asynchrous function that might throw
  // after we've sent a response to client
  return async (err: any, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) return next(err);

    if (interpreter) {
      err = interpreter(err);
    }

    // exit early when we don't understand it
    if (!(err instanceof ControllerError)) {
      logger.error({ err, res, req });
      return res.jSend.error(
        null,
        "We are having internal issues. Please bear with us",
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }

    if (err instanceof IrisAPIError) {
      err.data = err.data.data;
      err.message = err.data.message;
    }

    if (err instanceof IrisServerError || code === 500) {
      // err.original_message = err.message;
      err.message = "We are having internal issues. Please bear with us";
    }

    res.jSend.error(err["data"], err.message, err.code);
    logger.error({ err, res, req });
  };
}
