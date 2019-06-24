import HttpStatus from 'http-status-codes';

export interface HttpError {
  readonly code: number;
}

export interface HttpDataError extends HttpError {
  readonly data: any
}

export class ServerError extends Error implements HttpError {
  code: number;
  constructor(message: string) {
    super(message)
    this.code = HttpStatus.INTERNAL_SERVER_ERROR
  }
}

export class ControllerError extends Error implements HttpError {
  code: number;
  constructor(message: string) {
    super(message);
  }
}

export class ActionNotAllowedError extends ControllerError implements HttpError {
  constructor(message: string) {
    super(message);
    this.code = HttpStatus.BAD_REQUEST;
  }
}

export class NotFoundError extends ControllerError implements HttpError {
  constructor(message: string) {
    super(message);
    this.code = HttpStatus.NOT_FOUND;
  }
}

export class ConstraintError extends ControllerError implements HttpError {
  constructor(message: string) {
    super(message);
    this.code = HttpStatus.UNPROCESSABLE_ENTITY;
  }
}

export class ConstraintDataError extends ControllerError implements HttpDataError {
  data: any;
  code = HttpStatus.UNPROCESSABLE_ENTITY;
  constructor(message: string, data: any) {
    super(message);
    this.data = data;
  }
}