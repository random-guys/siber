import { Response } from "express";

export interface Left<E> {
  type: "error";
  value: E;
}

export interface Right<T> {
  type: "success";
  value: T;
}

export type Either<T, E> = Right<T> | Left<E>;
export type PendingResult<T, E> = Promise<Either<T, E>>;

export async function sendChunks<T, E>(
  res: Response,
  chunks: PendingResult<T, E>[]
): Promise<void> {
  // start SSE pipeline
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive"
  });

  // create tracker
  let counter = chunks.length;
  const checkAndClose = () => {
    counter -= 1;
    if (counter === 0) {
      res.write(patch("close", {}));
      res.end();
    }
  };

  // run in parallel
  chunks.forEach(async result => {
    const { type, value } = await result;
    res.write(patch(type, value));
    checkAndClose();
  });
}

function patch<T>(event: string, data: T) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}
