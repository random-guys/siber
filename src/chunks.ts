import Logger from "bunyan";
import { EventEmitter } from "events";
import { Request, Response } from "express";

export type Chunk<T> = Promise<T>;

/**
 * Send a list of `Chunk`(promise of value) using SSE
 * @param logger bunyan logger to track the state of the response
 * @param req express request
 * @param res express response
 * @param chunks list of chunks
 */
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
  const checkAndClose = (handle: NodeJS.Timeout) => {
    counter -= 1;
    if (counter === 0) {
      res.write(patch("close"));
      res.end();
      clearInterval(handle);
      logger.info({ req }, "Closed SSE stream");
    }
  };

  // keep connection alive
  const handle = setInterval(() => {
    res.write(":\n\n");
    logger.info({ req }, "Sent keep-alive message");
  }, 3000);

  // run in parallel
  chunks.forEach(async chunk => {
    try {
      res.write(patch("success", await chunk));
      logger.info({ req }, "Sending success event");
    } catch (err) {
      res.write(patch("error", err.message));
      logger.info({ req, err }, "Sending error event");
    }
    checkAndClose(handle);
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

/**
 * Proxy `source` events from `emitter` to `destination` over SSE.
 * @param req express Request
 * @param res express Response
 * @param emitter the event emitter to listen on
 * @param eventMap map of source events to destination events
 */
export function proxy(
  logger: Logger,
  req: Request,
  res: Response,
  emitter: EventEmitter,
  eventMap: object
) {
  // keep connection alive
  const handle = setInterval(() => {
    res.write(":\n\n");
  }, 10000);

  const handlerFn = (destination: string) => (e: any) => {
    res.write(patch(destination, e));
    logger.info({ req, data: e }, `Sending ${destination} event`);
  };

  // start SSE pipeline
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive"
  });

  logger.info({ req, res }, "Started SSE stream");

  res.on("close", () => {
    Object.keys(eventMap).forEach(event => {
      emitter.removeListener(event, handlerFn(eventMap[event]));
    });
    clearInterval(handle);
    logger.info({ req }, "Cleaned up SSE");
  });

  Object.keys(eventMap).forEach(event => {
    emitter.on(event, handlerFn(eventMap[event]));
  });
}
