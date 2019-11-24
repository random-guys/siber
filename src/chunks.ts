import { Response } from "express";

export type Chunk<T> = Promise<T>;

export async function sendChunks<T>(res: Response, chunks: Chunk<T>[]) {
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
      res.write(patch("close"));
      res.end();
    }
  };

  // run in parallel
  chunks.forEach(async chunk => {
    try {
      res.write(patch("success", await chunk));
    } catch (err) {
      res.write(patch("error", err.message));
    }
    checkAndClose();
  });
}

function patch<T>(event: string, data?: T) {
  if (data) {
    return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  } else {
    return `event: ${event}\ndata\n\n`;
  }
}
