<!-- title: HTTP Controller; order: 3 -->
# Concept

`HttpController` manages requests come from an HTTP client.

# How To Use?

You just create a file in `src/controllers`, this file should export a default
class that extends `HttpController`, and it will be auto-loaded when the 
server starts.

## Example

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

The decorator `route`, is a function, and an interface. When calling as a 
function, it accepts these forms:

- `route(routeStr: string)` e.g. `route("GET /demo")`
- `route(httpMethod: string, path: string)` e.g. `route("GET", "/demo")`

When using as interface, it contains these methods, each one is a short-hand 
for corresponding HTTP request method.

- `route.delete(path: string)`
- `route.get(path: string)`
- `route.head(path: string)`
- `route.patch(path: string)`
- `route.post(path: string)`
- `route.put(path: string)`
- `route.sse(path: string)` SSE uses GET approach, and implemented by client 
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
     * This route path will macth any URL that starts with /user/, 
     * e.g /user/, /user/1, /user/1/edit, and so on.
     */
    @route.get("/user/:path+")
    getUser3(req: Request) {
        return req.params.path; // => '', 1, 1/edit, etc.
    }

    /**
     * The '+' indicates one or more parameter matches
     * This route path will macth any URL that starts with /user, 
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

From the above example you see I passed a `uid: number` to the methods that 
bound to routes. Actually, you can do more, please have a look at
[Dependency Injection](./di#Auto-Injection-in-Controllers).

## Handle Asynchronous Operations

When dealing with asynchronous operations, you can define the method with 
modifier `async`, just like the following:

```typescript
import { HttpController, Request, Response, route } from "sfn";

export default class extends HttpController {
    @route.get("/")
    async index(req: Request, res: Response) {
        // you can use `await` here
    }
}
```

## Before And After Operations

If you want to do some asynchronous operations before calling the actual method,
JavaScript will not allow you define an `async constructor()`, but don't worry,
**SFN** provides you the way to do it, the framework allows you define the 
method `before()` and `after()` to control the flow.

```typescript
import * as fs from "fs";
import { HttpController, Request, Response, route } from "sfn";
import * as util from "util";

const readFile = util.promisify(fs.readFile);

export default class extends HttpController {
    txtData: string;

    async before() {
        this.txtData = await readFile("example.txt", "utf8");
    }

    after() {
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
[Aspect Oriented Programing](./aop-mixins#Aspect-Oriented-Programing).

### Handle Non-Promise Procedures

If your code includes some asynchronous functions, third-party modules that 
doesn't support `Promise`, then you can't use `await` or `yield` to handle 
them, to handle those asynchronous operations, you can either use the function
[util.promisify()](https://nodejs.org/dist/latest-v8.x/docs/api/util.html#util_util_promisify_original)
(NodeJS 8.0+) or module [es6-promisify](https://github.com/digitaldesignlabs/es6-promisify)
to wrap them, or use them directly, and wherever you want to send data to 
front-end, just call `res.send()`. Look this example:

```typescript
import { HttpController, Request, Response, route } from "sfn";
import * as fs from "fs";
import * as util from "util";

export default class extends HttpController {
    filename = "somefile";

    @route.get("/check-file")
    checkFile() {
        fs.exists(this.filename, exists => {
            if (exists) {
                res.send(this.success("File exists!"));
            } else {
                res.send(this.error("File doesn't exist!"));
            }
        });
    }

    @route.get("/check-file-promisify")
    async checkFilePromisify() {
        // require NodeJs higher than 8.0
        var fileExists = util.promisify(fs.exists),
            exists = await fileExists(this.filename);

        if (exists) {
            return this.success("File exists!");
        } else {
            return this.error("File doesn't exist!");
        }
    }
}
```

## The Constructor

Some times you may want to do something before the actual method is called, 
you want to initiate some configurations before the class is instantiated, you
want to customize the `constructor` of the class, just like this:

```typescript
import { HttpController, Request, Response } from "sfn";

export default class extends HttpController {
    constructor(req: Request, res: Response) {
        super(req, res);

        // your stuffs...
    }
}
```

## Throw HttpError In the Controller

`HttpError` is a customized error class that safe to use when you're going to 
response an HTTP error to the client. when an HttpError is thrown, the framework
will handle it properly, and sending error response automatically.

```typescript
import { HttpController, HttpError, route } from "sfn";

export default class extends HttpController {
    @route.get("/example")
    example() {
        let well: boolean = false;
        let msg: string;
        // ...
        if (!well) {
            if (!msg)
                throw new HttpError(400); // => 400 bad request
            else
                throw new HttpError(400, msg); // => 400 with customized message
        }
    }
}
```

The framework will check what response type the client accepts, and send the 
error properly. More often, a common HTTP error will be responded. But if an 
`Accept: application/json` is present in the request headers, a `200` status 
will be responded with a JSON that contains `{success: false, code, error}`, 
according to the specification of the controller method [error()](#Common-API-Response).

If this header isn't present, then the framework will check if there is a 
template in the `src/views/` named just the same as the error code 
(e.g. `400.html`). If the file exists, then it will be sent as an error page. 
Otherwise, a simple error response will be sent.

### Customize Error Page

By default, the framework will send a view file according to the error code, 
and only pass the `err: HttpError` object to the template, it may not suitable
for complicated needs. For this reason, the framework allows you to customize 
the error view handler by rewriting the static method 
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
method `succes()` and method `error()` to send a structured response that 
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
            return this.error(err, err instanceof NotFoundError ? 404 : 500);
            // { success: false, code: 404 | 500, error: err.message }
        }
    }
}
```

## Bind Multiple Methods and Returns Many Values.

In an HttpController, if several methods are bound to the same route, these 
methods will be called accordingly. Except SSE, with other request modes, only 
the first valid (non-`undefined`) value will be sent to the client. Even 
multiple methods are bound, a controller will only be instantiated once, 
`before()` and `after()` methods will also be called only once. However, if a 
route is bound to multiple controllers, they will all be instantiated 
accordingly, and their `before()` and `after()` methods will be called as 
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

## HttpController And Service

A controller is actually a service, you can use any features that works in 
[Service](./service) in a controller.