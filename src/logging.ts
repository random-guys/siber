import Logger from 'bunyan';
import { NextFunction, Request, Response } from 'express';
import uuid from 'uuid/v4';

function removeSensitiveData(body: any, props: string[]) {
  const allKeys = Object.keys(body);
  const permittedKeys = allKeys.filter(k => props.indexOf(k) === -1);

  return permittedKeys.reduce((payload, k) => {
    payload[k] = body[k];
    return payload;
  }, {});
}

/**
 * Create a function that serializes an Express request
 * for Bunyan logging
 * @param sensitiveProps key names of sensitive properties
 */
export function createRequestSerializer(...sensitiveProps: string[]) {
  return (req: Request) => {
    if (!req || !req.connection) return req;

    return {
      method: req.method,
      url: req.url,
      headers: req.headers,
      origin_service: req.headers['x-origin-service'],
      remoteAddress: req.connection.remoteAddress,
      remotePort: req.connection.remotePort,
      id: req.id,
      ...(req.body && Object.keys(req.body).length !== 0
        ? { body: removeSensitiveData(req.body, sensitiveProps) }
        : undefined)
    };
  };
}

/**
 * Serializes an Express response for Bunyan logging
 * @param res Express response object
 */
export const resSerializer = (res: Response) => {
  if (!res || !res.statusCode) return res;
  return {
    statusCode: res.statusCode,
    // @ts-ignore
    headers: res._headers
  };
};

/**
 * Extends the standard bunyan error serializer and allows custom fields to be added to the error log
 */
export const errSerializer = (err: any) => {
  const { url, data, req, response, config } = err;
  const bunyanSanitizedError = Logger.stdSerializers.err(err);
  return {
    ...bunyanSanitizedError,
    url,
    data,
    req,
    config,
    ...(response &&
      typeof response === 'object' && {
        response: {
          config: response.config,
          data: response.data,
          status: response.status
        }
      })
  };
};

/**
 * Express Middleware that logs incoming HTTP requests.
 */
export function requestTracker(log: Logger) {
  return (req: Request, _res: Response, next: NextFunction) => {
    // create a request ID for tracking if non exists
    if (!req.headers['x-request-id']) {
      req.headers['x-request-id'] = uuid();
    }

    // @ts-ignore because TS can be smarted...maybe
    req.id = req.headers['x-request-id'];

    // log requests
    log.info({ req });

    // c'est fini
    next();
  };
}

export function enableElasticSearch(logger: Logger) {
  // @ts-ignore ...because Chudi said so
  logger._emit = (rec: any, noemit: any) => {
    rec.message = rec.msg;
    rec.timestamp = rec.time;

    delete rec.msg;
    delete rec.time;
    delete rec.v;

    //@ts-ignore
    // Call the default bunyan emit function with the modified log record
    bunyan.prototype._emit.call(this.log, rec, noemit);
  };
}
