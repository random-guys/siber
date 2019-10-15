import { JSendContract } from './jsend';

export * from './compose';
export * from './controller';
export * from './errors';
export * from './middleware';
export * from './logging';
export * from './jsend';
export * from './validate';

declare global {
  namespace Express {
    export interface Request {
      id: string;
    }

    export interface Response {
      jSend: JSendContract;
    }
  }
}
