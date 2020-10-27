<!-- title: HTTP Controller; order: 4 -->
## Concept

`HttpController` manages requests come from an HTTP client. Essentially, it is a
class inherited from [Service](./service), but unlike the singleton model of the
service, Controllers are one-time products. An instance will be created when a
request comes and will be destroyed after the request has gone. Therefore, the
Controller overrides some methods from the base class to allow it fitting this
special running model, in the meantime to keep the same development experience
as ordinary services. 

## Usage Example

You just create a file in `src/controllers`, this file should export a
default class that extends `HttpController`, and it will be auto-loaded when the 
server starts.

```typescript
import { HttpController, route } from "sfn";

export default class extends HttpController {
    @route.get("/demo")
    index() {
        return "Hello, World!";
    }
}
```

## Relations Between the Route and Method

When a method is decorated with `@route`, this method is bound to a certain 
URL route. When visiting a URL that matches the route, the method will be
automatically called, and the returning value will be sent back to the client
with proper forms.

The decorator `route`, is a function, and an namespace. When calling as a 
function, it accepts these forms:

- `route(routeStr: string)` e.g. `route("GET /demo")`
- `route(httpMethod: string, path: string)` e.g. `route("GET", "/demo")`

When using as a namespace, it contains these methods, each one is a short-hand 
for the corresponding HTTP request method.

- `route.delete(path: string)`
- `route.get(path: string)`
- `route.head(path: string)`
- `route.patch(path: string)`
- `route.post(path: string)`
- `route.put(path: string)`
- `route.sse(path: string)` SSE uses GET method, and connected via client's 
    EventSource.

### Route Formats

The framework uses [path-to-regexp](https://github.com/pillarjs/path-to-regexp) 
to parse URL routes, here I will just give you some common usage to 
demonstrate those rules, for more details, you need to check the documentation 
of this module.

```typescript
import { HttpController, Request, route } from "sfn";

export default class extends HttpController {
    /**
     * Common URL path
     * GET /user
     */
    @route.get("/user")
    index() { }

    /**
     * The ':' indicates a URL parameter.
     * This route path will match /user/1, /user/2, /user/3, and so on.
     */
    @route.get("/user/:id")
    getUser(req: Request) {
        return req.params.id; // => 1
    }

    /**
     * The '?' indicates the parameter is optional.
     * This route path will match /user/1, /user/1/edit, and so on.
     */
    @route.get("/user/:id/:action?")
    getUser2(req: Request) {
        return {
            id: req.params.id, // => 1
            action: req.params.action // => undefined or any strings provided.
        };
    }

    /**
     * The '+' indicates one or more parameter matches
     * This route path will match any URL that starts with /user/, 
     * e.g /user/, /user/1, /user/1/edit, and so on.
     */
    @route.get("/user/:path+")
    getUser3(req: Request) {
        return req.params.path; // => '', 1, 1/edit, etc.
    }

    /**
     * The '+' indicates one or more parameter matches
     * This route path will match any URL that starts with /user, 
     * e.g /user, /user/, /user/1, /user/1/edit, and so on.
     */
    @route.get("/user/:path*")
    getUser4(req: Request) {
        return req.params.path; // => undefined, '', 1, 1/edit, etc.
    }
}
```

### Set Up baseURI

By default, routes are bound to the root URI `/`, you can set the static 
property `baseURI` to change it to another path.

```typescript
export default class extends HttpController {
    static baseURI = "/api";

    /**
     * @example GET /api/user/1
     */
    @route.get("/user/:uid")
    getUser(uid: number) {
        // ...
    }
}
```

## Signature of Methods

In the above example, you see I passed a `uid: number` to the methods that
bound to routes. Actually, you can do more, please have a look at
[Dependency Injection](./di#Auto-Injection-in-Controllers).

### Signature of the Constructor

All HttpController constructors accept two arguments: `req: Request` and
`res: Response`.

```typescript
import { HttpController, Request, Response } from "sfn";

export default class extends HttpController {
    constructor(req: Request, res: Response) {
        super(req, res);
        // your stuffs...
    }
}
```

## Before And After Operations

Just like in a service, you can override `init()` and `destroy()` methods, to
allow the controller performing initiation and destruction operations.

```typescript
import * as fs from "fs";
import { HttpController, Request, Response, route } from "sfn";
import * as util from "util";

const readFile = util.promisify(fs.readFile);

export default class extends HttpController {
    txtData: string;

    async init() {
        await super.init();
        this.txtData = await readFile("example.txt", "utf8");
    }

    async destroy() {
        await super.destroy();
        // This method is just for example, it's not necessary here, but 
        // sometimes you should define it and say, close database connections in 
        // it.
        this.txtData = void 0;
    }

    @route.get("/example")
    example() {
        return this.txtData;
    }
}
```

For more advanced usage, please see 
[Aspect Oriented Programing](./mixins-aop#Aspect-Oriented-Programming).

### Using Async Syntactical

In network-oriented programming, it is always recommended to use async methods,
even there isn't any async operation inside the method, because of these methods
are invoked through the network (async IO), thus using `async` will make them
more syntactical (Of course this is a recommendation, it's not required).

But if your code uses some asynchronous functions or third-party packages that
don't support `Promise`, then you can use `util.promisify()` to wrap them as
promises. Please check the following example.

```typescript
import { HttpController, Request, Response, route } from "sfn";
import * as fs from "fs";
import * as util from "util";

const fileExists = util.promisify(fs.exists),

export default class extends HttpController {
    @route.get("/check-file")
    async checkFile() {
        if (await fileExists("somefile")) {
            return this.success("File exists!");
        } else {
            return this.fail("File doesn't exist!");
        }
    }
}
```

## Throw HttpException In the Controller

`HttpException` is a customized error class that safe to use when you're going
to 
response an HTTP error to the client. when a HttpException is thrown, the
framework will handle it properly, and sending error response automatically.

```typescript
import { HttpController, HttpException, route } from "sfn";

export default class extends HttpController {
    @route.get("/example")
    async example() {
        let well: boolean = false;
        let msg: string;
        // ...
        if (!well) {
            if (!msg) {
                throw new HttpException(400); // => 400 bad request
            } else {
                // => 400 with customized message
                throw new HttpException(400, msg);
            }
        }
    }
}
```

The framework will check what response type the client accepts, and send the 
error properly. More often, a common HTTP error will be responded to. But if an 
`Accept: application/json` is present in the request headers, a `200` status 
will be responded with a JSON that contains `{success: false, code, error}`, 
according to the specification of the controller method
[fail()](#Common-API-Response).

If this header isn't present, then the framework will check if there is a 
template in the `src/views/` named just the same as the error code 
(e.g. `400.html`). If the file exists, then it will be sent as an error page. 
Otherwise, a simple error response will be sent.

### Customize Error Page

By default, the framework will send a view file according to the error code, 
and only pass the `err: HttpException` object to the template, it may not
suitable for complicated needs. For this reason, the framework allows you to
customize the error view handler by rewriting the static method 
`HttpController.httpErrorView`, the following example will show you how.

```typescript
// src/bootstrap/http.ts
import { HttpController } from "sfn";

HttpController.httpErrorView = function (err, instance) {
    let vars = {
        err,
        title: err.toString(),
        copyRight: "&copy; " + (new Date).getFullYear() + " My Website.",
        // ...
    };
    return instance.view(String(err.code), vars);
}
```

## Common API Response

Either in an HttpController or in a WebSocketController, you can always use 
method `success()` and method `fail()` to send a structured response that 
indicates a successful or failed operation.

```typescript
import { HttpController, route } from "sfn";
import { User, NotFoundError } from "modelar";

export default class extends HttpController {

    @route.post("/login")
    async login(req: Request) {
        try {
            let email = req.body.email,
                password = req.body.password,
                user = await User.use(this.db).login({ email, password });

            req.session.uid = user.id;

            return this.success(user);
            // { success: true, code: 200, data: user }
        } catch (err) {
            return this.fail(err, err instanceof NotFoundError ? 404 : 500);
            // { success: false, code: 404 | 500, error: err.message }
        }
    }
}
```

## Bind Multiple Methods and Returns Many Values.

In an HttpController, if several methods are bound to the same route, these
methods will be called accordingly. Except for SSE, with other request modes,
only the first valid (non-undefined) value will be sent to the client. Even
multiple methods are bound, a controller will only be instantiated once, 
`init()` and `destroy()` methods will also be called only once. However, if a 
route is bound to multiple controllers, they will all be instantiated
accordingly, and their `init()` and `destroy()` methods will be called as
expected.

However, if it's an SSE route, then all the returning values of all bound
methods will be sent to the client accordingly, and, if the method is a 
generator, any values `yield`ed by it will be sent as well. that means you can
use a generator to send data continuously.

```typescript
import { HttpController, Request, Response, route } from "sfn";

export default class extends HttpController {
    @route.sse("/generator-example")
    async *index(req: Request, res: Response) {
        let i = 0;

        while (true) {
            yield i++; // the client will receive 1, 2, 3...10 continuously.

            if (i === 10) {
                break;
            }
        }
    }
}
```

### Receive Data Continuously via EventSource

```ts
var es = new EventSource("/generator-example");

es.onmessage = ({ data }) => {
    if (es.readyState === EventSource.CLOSED) {
        console.log("All data has been delivered");
    } else {
        console.log(data); // will print 1, 2, 3...10 continuously.
    }
};
es.onerror = () => {
    if (es.readyState === EventSource.CLOSED) {
        console.log("All data has been delivered");
    } else {
        console.log("Something went wrong");
    }
};
```
