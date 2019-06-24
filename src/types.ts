import { Query } from "@random-guys/bucket";

export type PaginationOptions = Pick<
  Query,
  Exclude<keyof Query, 'conditions' | 'archived'>
>