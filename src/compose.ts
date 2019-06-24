import { RequestHandler } from "express";

export default function compose(...middleware: RequestHandler[]) {
  return middleware.reduce(
    (a, b) =>
      (req, res, next) =>
        a(req, res, (err) => {
          if (err) return next(err)
          b(req, res, next)
        })
  )
}