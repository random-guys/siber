import { Query } from "@random-guys/bucket";

export type PaginationOptions = Pick<
  Query,
  Exclude<keyof Query, 'conditions' | 'archived'>
>

export interface SiberConfig {
  cors: boolean | CORSConfig
  jsend: boolean
  tracking: boolean
}

export interface CORSConfig {
  cookies: boolean
  source?: string
  mode: 'dev' | 'prod'
}