import { RequestHandler, Response } from "express";
import HttpStatus from "http-status-codes";

export const refreshJSend: RequestHandler = (_req, res, next) => {
  res.jSend = new JSend(res);
  next();
};

export interface JSendContract {
  success(data: any): any;
  fail(data: any): any;
  error(data: any, message: string, code?: number): any;
}

export class JSend implements JSendContract {
  constructor(private readonly res: Response) {}

  success(data: any) {
    this.res.json({ status: "success", data });
  }

  fail(data: any) {
    this.res
      .status(HttpStatus.EXPECTATION_FAILED)
      .json({ status: "fail", data });
  }

  error(data: any, message: string, code?: number) {
    const httpCode = code || HttpStatus.INTERNAL_SERVER_ERROR;
    this.res.status(httpCode).json({
      status: "error",
      data,
      message,
      code: httpCode
    });
  }
}
