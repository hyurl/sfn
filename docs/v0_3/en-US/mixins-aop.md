<!-- title: Mixins and AOP; order: 18 -->
# Concept

The design of **Mixins** and **AOP** is meant to write highly re-useful code 
that suits for many scenarios and you don't have to expand your class.

## Horizontal Inheritance (Mixins)

**Mixins** allows you inherit methods and properties from multiple classes 
instead of only the supper class. To use mixins, you will need to install 
another package [class-mixins](https://github.com/hyurl/class-mixins), you 
should check out its documentation to be more understood of it features.

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

## Aspect Oriented Programming

**AOP** is an important part in an SFN application, an it is very easy to 
achieve. To use this feature, you just need to install another package named 
[function-intercept](https://github.com/hyurl/function-intercept).

```typescript
import { HttpController, before, after } from "sfn";
import { interceptAsync } from "function-intercept";

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
the method via the decorator. But most times you would want to defined the 
function that can be reused in many scenarios.

```typescript
import { HttpController } from "sfn";
import { interceptAsync } from "function-intercept";

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
to use as decorators as you want, and for convenience, you can define the 
intercepter function as decorator and manually call `before` and `after` inside 
it, please check the example of module 
[sfn-validate-decorator](https://github.com/hyurl/sfn-validate-decorator).

## Plugins

Plugin is another way to implement AOP in a software. By using plugins, one can 
easily write pluggable and extendable components to manipulate objects without 
having to modify any source code.

In SFN, to use plugins, you will need to install another package named
[async-plugin](https://github.com/hyurl/). For convenience, you should create a 
new folder `plugins/` inside `src/` directory to store all the plugins.

```typescript
// src/plugins/user.ts
import { User } from "modelar";
import AsyncPlugin from "async-plugin";
import Axios from "axios";

export namespace UserPlugins {
    export const onAdd = new AsyncPlugin({}, User);
    export const onGet = new AsyncPlugin({}, User);
    export const onUpdate = new AsyncPlugin({}, User);
    export const onDelete = new AsyncPlugin({}, User);
    // ...
}

// You can bind any number of handler functions to the corresponding plugin in 
// order to achieve some goals. e.g.

// assign user name
UserPlugins.onAdd.bind((input, user) => {
    user.name = input.name || "Joe";
});

// check if email is available
UserPlugin.onAdd.bind(async (input, user) => {
    if (input.email) {
        // check email via a remote service
        let res = await Axios.get(`https://somewhere.com/email-test?email=${input.email}`);
        let ok = res.data.ok;

        if (!ok) {
            throw new Error("user email is invalid or unsupported.");
        }

        user.email = input.email;
    }
});

// ...
```

You can apply the plugin in an HttpController (or anywhere you want).

```typescript
// src/controllers/api/user.ts
import { HttpController, Request, route } from "sfn";
import { User } from "modelar";
import { UserPlugins } from "../../../plugins/user.ts";

export default class extends HttpController {
    static baseURI = "/api";

    @route.post("/user")
    async add(req: Request) {
        // apply the plugin and handle data in the plugin instead of doing it 
        // in the controller.
        let user = await UserPlugins.onAdd.apply(req.body || {}, new User);
        return user.save();
    }
}
```

Plugins are pluggable components, if you want to add a new function inside some 
procedure, you just need to bind a new handler on the plugin interface, and if 
you want to remove some function, you just need to remove that corresponding 
handler from the plugin interface. By doing this, you're able to write highly 
extendable software by just building a plugin system that covers all the entries
of your program life cycle.
