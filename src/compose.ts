import { RequestHandler } from "express";
import { ControllerError } from "./errors";

/**
 * Merges multiple middleware to one, such that requests are
 * passed from left to right
 * @param middleware list of middleware to merge
 */
export function compose(...middleware: RequestHandler[]) {
  return middleware.reduce((a, b) => (req, res, next) =>
    a(req, res, err => {
      if (err) return next(err);
      b(req, res, next);
    })
  );
}

export type Interpreter = (error: Error) => ControllerError | null;

/**
 * Like `compose`, but rather than merge middleware, it merges
 * error interpreters(`Error -> ControllerError`). This is meant to be
 * used as the last parameter to `universalErrorHandler`
 * @param handler list of error handlers to merge
 */
export function composeE(...handlers: Interpreter[]): Interpreter {
  return (err: Error) => {
    return tryFunctions(err, handlers);
  };
}

function tryFunctions(err: Error, [f, ...fs]: Interpreter[]) {
  const intrp = f(err);
  if (intrp instanceof ControllerError) {
    return intrp;
  }
  return tryFunctions(err, fs);
}
