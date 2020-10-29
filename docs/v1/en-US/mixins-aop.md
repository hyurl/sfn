<!-- title: Mixins & AOP; order: 14 -->
## Concept

The design of **Mixins** and **AOP** is meant to write highly re-useful code 
that suits many scenarios and you don't have to expand your class.

## Horizontal Inheritance (Mixins)

**Mixins** allows you inherit methods and properties from multiple classes
instead of only the supper class. To use mixins, you will need to install
another package [class-mixins](https://github.com/hyurl/class-mixins), you
should check out its documentation to be more understood of its features.

```typescript
// <SRC_PATH>/mixins/CheckUserState.ts
import { HttpController } from "sfn";

export class CheckUserState extends HttpController {
    private loggedIn: boolean;

    async ensureLogin() {
        if (this.loggedIn) {
            // ...
        }
    }
}
```

```typescript
// <SRC_PATH>/controllers/User.ts
import { HttpController } from "sfn";
import { Mixed } from "class-mixins";
import { CheckUserState } from "../mixins/CheckUserState";

export default class extends Mixed(HttpController, CheckUserState) {
    async display() {
        await this.ensureLogin();
        // ...
        // be aware that this instance is an instance of HttpController, but 
        // not of CheckUserState, so
        console.log(this instanceof HttpController); // true
        console.log(this instanceof CheckUserState); // false
    }
}
```

## Aspect-Oriented Programming

**AOP** is an important part of an SFN application, and it is very easy to
achieve. To use this feature, you just need to install another package named 
[function-intercepter](https://github.com/hyurl/function-intercepter).

```typescript
import { HttpController } from "sfn";
import { interceptAsync } from "function-intercepter";

export default class MyController extends HttpController {
    private loggedIn: boolean;

    @interceptAsync<MyController>().before(async function () {
        // the `this` in this function reference to the controller instance
        // ...
        if (!this.loggedIn) {
            this.res.redirect("/login");
            // returning `false` to prevent invoking the main method.
            return false;
        }
    }).after(async function () {
        // this function will be called after the method has been called
    })
    async display() {
        // ...
    }
}
```

The above example only shows you how to directly set intercepter functions upon
the method via the decorator. But most times you would want to define the
function that can be reused in many scenarios.

```typescript
import { HttpController } from "sfn";
import { interceptAsync } from "function-intercepter";

export function checkLogin(this: HttpController) {
    // ...
    if (!this["loggedIn"]) {
        this.res.redirect("/login");
    }
}

export default class extends HttpController {
    @interceptAsync().before(checkLogin)
    display() {
        // ...
    }
}

export class AnotherController extends HttpController {
    @interceptAsync().before(checkLogin)
    show() {
        // ...
    }
}
```

Other than directly calling `before` and `after`, you can define any functions 
to be used as decorators as you want by wrapping it inside of
`interceptAsync().before()`. Actually,
[@requireAuth](/api/v1/decorators#requireAuth) also uses this technique under
the hood.

```ts
import { interceptAsync, intercept } from 'function-intercepter';

/** Requires authentication when calling the method. */
export const requireAuth: ControllerDecorator = interceptAsync().before(
    function (this: Controller) {
        if (!this.authorized) {
            if (this instanceof HttpController) {
                if (typeof this.fallbackTo === "string") {
                    this.res.redirect(this.fallbackTo, 302);
                } else if (this.fallbackTo) {
                    this.res.send(this.fallbackTo);
                } else {
                    throw new HttpException(401);
                }

                return intercept.BREAK;
            } else {
                throw new HttpException(401);
            }
        }
    }
);
```

## Hooks

The hook is another way to implement AOP in software. By using hooks, one can 
easily write pluggable and extendable components to manipulate objects without 
having to modify any source code.

Since version 0.5.x, SFN introduced new internal hook support and implemented
hot-reloading and auto-loading. Hooks do not need to create the instance, and
all hooks will be loaded into the system when startup. All hooks should be
located in path `src/hooks/`.

```typescript
// src/hooks/user.ts
import { Hook } from 'sfn';
import Axios from "axios";
import User from "../models/user";

declare global {
    namespace app {
        namespace hooks {
            namespace user {
                const onAdd: Hook<object, User>;
            }
        }
    }
}

// You can bind any number of handler functions to the corresponding hook in 
// order to achieve some goals. e.g.

// assign user name
app.hooks.user.onAdd.bind((input, user) => {
    user.name = input.name || "Joe";
});

// check if email is available
app.hooks.user.onAdd.bind(async (input, user) => {
    if (input.email) {
        // check email via a remote service
        let url = `https://somewhere.com/email-test?email=${input.email}`;
        let res = await Axios.get(url);
        let ok = res.data.ok;

        if (!ok) {
            throw new Error("user email is invalid or unsupported.");
        }

        user.email = input.email;
    }
});
```

You can apply the hook in an HttpController (or anywhere you want).

```typescript
// src/controllers/api/user.ts
import { HttpController, Request, route } from "sfn";

export default class extends HttpController {
    static baseURI = "/api";

    @route.post("/user")
    async add(req: Request) {
        // apply the hook and handle data in the hook instead of doing it 
        // in the controller.
        let data = req.body || {};
        let user = new app.models.user();

        user = await app.hooks.user.onAdd.invoke(data, user);

        return user.save();
    }
}
```

### Internal Hook Interface

SFN reserved a hook interface [lifeCycle](/api/v1/Hook#app_hooks_lifeCycle),
used to control all activities related to server startup and shutdown, also you
can add your own logic to this interface, to open or close some resources during
startup and shutdown. The following example comes from the SFN website itself.

```typescript
// Try to safely close the logger service.
app.hooks.lifeCycle.shutdown.bind(async () => {
    await app.services.logger.close();
});
```

Hooks are hot-pluggable components. If you want to add a new function inside 
some procedure, you just need to bind a new handler on the hook interface, and
if you want to remove some function, you just need to remove that corresponding 
handler from the hook interface, and take advantage of the hot-reloading 
feature to automatically apply any changes. By doing this, you're able to write 
highly extendable software by just building a hook system that covers all the
entries of your program's life cycle.
