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

## TODO

- [ ] Tests
- [ ] Refactor filesystem structure
- [ ] Removed dependency on JSend
- Move integration code to new packages
  - [ ] `siber-bucket`
  - [ ] `siber-provcs`
