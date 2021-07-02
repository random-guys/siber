# siber

Controllers as classes. This lib abstracts away the internals of controllers.

## How to install?

`yarn add @random-guys/siber`

Also, you need `yarn add inversify-express-utils`

## How does it work?

`my.controller.ts`

```ts
export class MyController extends Controller<MyResponseType> {
  @httpGet('/', myMiddleWare)
  async getData(@request() req: Request, @response() res: Response) {
    try {
      // ...do somethings
      this.handleSuccess(req, res, myResponse);
    } catch (err) {
      this.handleError(req, res, err);
    }
  }
}
```

In your `ioc.ts`

```ts
import { Container } from 'inversify';
import './my.controller.ts';

const container = new Container();
export default container;
```

Finally, in your `app.ts`

```ts
const server = new InversifyExpressServer(container, null);
.server.setConfig((app: Application) => {
  siber.buildInto(app, logger, {
    cors: false,
    jsend: true,
    tracking: true
  })
})
```

## What is SiberMetrics and how it works.

- Record metrics from HTTP Request
- Metrics exporter

Create an instance of the SiberMetrics in your server:

```ts
export const Metrics = new SiberMetrics(env);
```

SiberMetrics allow you to record `success` or `failure` requests. You can either record metrics in your `Controller` or `Error` handler using its `record` method:

```ts
Metrics.record(req, res);
```

Also siberMetrics allow the export of all recorded metrics to prometeus server through the `send` method:

Create an HTTP Handler to expose your server metrics to prometeus server.

```ts
app.get("/metrics", Metrics.send.bind(Metrics));
```

## Parsing your environment variables

Siber `autoloadEnv` function helps to parse and validate server environment variables.

# Usage
To use `autoloadEnv` you need to define;

- The `type` definition of your server environment configurations
- joi validation schema for the `type` definition

```ts
import joi from "@hapi/joi";
import { autoloadEnv, siberConfig, mongoConfig, redisConfig } from "@random-guys/siber";

interface EnvironmentConfig {
  any_variable: string
}

export const env = autoloadEnv<EnvironmentConfig>(
  siberConfig({
    ...mongoConfig,
    ...redisConfig,
    any_variable: joi.string().required(),
  })
);
```

`siberConfig` creates a joi schema to determine and validate the configuration.

PS: `mongoConfig` and `redisConfig` are environment schema object for mongodb and redis.

## TODO

- [ ] Tests
- [ ] Refactor filesystem structure
- [ ] Removed dependency on JSend
- Move integration code to new packages
  - [ ] `siber-bucket`
  - [ ] `siber-provcs`
