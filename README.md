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

## To record metrics in your application

in your server common -> services -> `index.ts` directory, create a new instance of SiberMetrics

```ts
export const Metrics = new SiberMetrics(env);
```

Send prometeus metrics, in `app.ts`

```ts
app.get("/metrics", Metrics.send.bind(Metrics));
```

in your server base controller inherit the the methods of SiberMetrics

```ts
export class ProController<T> extends Controller<T> {
  constructor() {
    super(Log, Metrics);
  }
}
```

Now you can record your requests metrics directly in your endpoints
```ts
this.metrics.record(req, res);
```

Finally, you can also record errors metric

```ts
handleError(req: Request, res: Response, err: Error, message?: string) {
  // your error handling logic here

  Metrics.record(req, res);
}
```

## To use siber for your env import

If you want the full package i.e SessionedApp MongoConfig AppConfig and RedisConfig, import DApp otherwise
import the class or package, you want.

```ts
import joi from "@hapi/joi";
import { autoloadEnv, DBApp, mongoConfig, redisConfig, siberConfig } from "@random-guys/siber";

export interface ServerEnv extends DBApp {
  // environmental values goes here i.e
  amqp_url: string;
}

export const env = autoloadEnv<ServerEnv>(
  siberConfig({
    // ServerEnv validation goes here
    ...redisConfig,
    ...mongoConfig,
    amqp_url: joi.string().uri().required(),
  })
);

you can now have `env.amqp_url`
```

## TODO

- [ ] Tests
- [ ] Refactor filesystem structure
- [ ] Removed dependency on JSend
- Move integration code to new packages
  - [ ] `siber-bucket`
  - [ ] `siber-provcs`
