import { Request, Response } from "express";
import Logger from "bunyan";

export type Chunk<T> = Promise<T>;

export async function sendChunks<T>(
  logger: Logger,
  req: Request,
  res: Response,
  chunks: Chunk<T>[]
) {
  // start SSE pipeline
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive"
  });

  logger.info({ req, res }, "Started SSE stream");

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
      logger.info({ req }, "Sending success event");
    } catch (err) {
      res.write(patch("error", err.message));
      logger.info({ req, err }, "Sending error event");
    }
    checkAndClose();
  });
}

function patch<T>(event: string, data?: T) {
  if (data) {
    const eventData = typeof data === "string" ? data : JSON.stringify(data);
    return `event: ${event}\ndata: ${eventData}\n\n`;
  } else {
    return `event: ${event}\ndata\n\n`;
  }
}
