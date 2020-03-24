import { JSendContract } from "./jsend";

export * from "./compose";
export * from "./controller";
export * from "./env";
export * from "./errors";
export * from "./jsend";
export * from "./logging";
export * from "./metrics";
export * from "./middleware";
export * from "./validate";

declare global {
  namespace Express {
    export interface Request {
      id: string;
    }

    export interface Response {
      jSend: JSendContract;
      body: any;
    }
  }
}
