export * from './compose';
export * from './controller';
export * from './errors';
export * from './middleware';
export * from './validate';

declare global {
  namespace Express {
    export interface Request {
      id: string;
    }
  }
}
