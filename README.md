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

SiberMetrics are wrapper around Prometheus client for Node.js to record and export metrics of an http request.

- Create a global instance of SiberMetrics

```ts
export const Metrics = new SiberMetrics(env);
```

- Record the request after it has been handled

```ts
Metrics.record(req, res);
```

- Create an HTTP Handler to expose your server metrics to prometheus server.

```ts
app.get("/metrics", Metrics.send.bind(Metrics));
```

## Parsing your environment variables

Siber `autoloadEnv` function helps to parse and validate server environment variables.

```ts
import joi from "@hapi/joi";
import { autoloadEnv, siberConfig, mongoConfig, redisConfig, DApp } from "@random-guys/siber";
```

- Create a `type` for your environment

```ts
interface Environment extends DApp {
  any_key: string
}

`siberConfig` return a joi schema of the environment variables.

 siberConfig({
    ...mongoConfig,
    ...redisConfig,
    any_key: joi.string().required(),
  })

`autoloadEnv` loads the validated environment

export const env = autoloadEnv<Environment>(
  siberConfig({
    ...mongoConfig,
    ...redisConfig,
    any_key: joi.string().required(),
  })
);
```

PS: `mongoConfig` and `redisConfig` are environment schema object for mongodb and redis. While `DAPP` is a `type` of all the basic environment variables

## TODO

- [ ] Tests
- [ ] Refactor filesystem structure
- [ ] Removed dependency on JSend
- Move integration code to new packages
  - [ ] `siber-bucket`
  - [ ] `siber-provcs`
