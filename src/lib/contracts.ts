import { Query } from '@random-guys/bucket';
import { CorsOptions } from 'cors';

export type PaginationOptions = Pick<
  Query,
  Exclude<keyof Query, 'conditions' | 'archived'>
>;

export interface SiberConfig {
  cors: boolean | CorsOptions;
  jsend: boolean;
  tracking: boolean;
}
