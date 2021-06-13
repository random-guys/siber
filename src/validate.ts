import { NextFunction, Request, RequestHandler, Response } from "express";
import joi, { SchemaLike, ValidationError } from "joi";
import { ConstraintDataError } from "./errors";

export type ValidationContext = "body" | "query" | "params";

export function parseError(error: ValidationError) {
  return error.details.reduce((acc, curr) => {
    acc[curr.context.key] = curr.message;
    return acc;
  }, {});
}

function innerValidate(data: any, schema: SchemaLike) {
  const mainSChema = joi.compile(schema);
  const { error, value } = mainSChema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  })

  if (!error) return { err: null, value: value };

  return {
    err: parseError(error),
    value: null
  };
}

export function validate(
  schema: SchemaLike,
  context: ValidationContext = "body"
): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const { err, value } = innerValidate(req[context], schema);

    if (!err) {
      req[context] = value;
      return next();
    }

    //log error
    const message = "One or more validation errors occured";
    throw new ConstraintDataError(message, err);
  };
}
