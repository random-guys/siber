import joi, { SchemaLike, ValidationError } from "@hapi/joi";
import { NextFunction, Request, Response } from "express";
import HttpStatus from "http-status-codes";

export type ValidationContext = "body" | "query" | "params";

export function parseError(error: ValidationError) {
  return error.details.reduce((acc, curr) => {
    acc[curr.context.key] = curr.message;
    return acc;
  }, {});
}

function innerValidate(data: any, schema: SchemaLike) {
  const { error, value } = joi.validate(data, schema, {
    abortEarly: false,
    stripUnknown: true
  });

  if (!error) return { err: null, value: value };

  return {
    err: parseError(error),
    value: null
  };
}

export function validate(
  schema: SchemaLike,
  context: ValidationContext = "body"
) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { err, value } = innerValidate(req[context], schema);

    if (!err) {
      req[context] = value;
      return next();
    }

    //log error
    const error = "One or more validation errors occured";
    return res.jSend.error(err, error, HttpStatus.UNPROCESSABLE_ENTITY);
  };
}
