import { RequestHandler } from "express";

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
