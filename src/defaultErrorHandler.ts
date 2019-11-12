import { Request, Response, NextFunction } from 'express';
import { IrisAPIError, IrisServerError } from '@random-guys/iris';
import { ConstraintDataError } from './errors';

export function defaultErrorHandler(req: Request, res: Response, next: NextFunction, err: Error, data?: any) {
  // useful when we have call an asynchrous function that might throw
  // after we've sent a response to client
  if (res.headersSent) {
    next(err);
  }
}