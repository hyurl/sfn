<!-- title: AOP and Mixins; order: 18 -->
# Concept

The design of **AOP** and **Mixins** is meant to write highly re-useful code 
that suits for many scenarios and you don't have to expand your class.

## Aspect Oriented Programing

**AOP** is an important part in an SFN application, an it is very easy to 
achieve. To use this feature, you just need to install another package named 
[function-intercepter](https://github.com/hyurl/function-intercepter).

```typescript
import { HttpController, before, after } from "sfn";
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
the method via the decorator. But most times you would want to defined the 
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
to use as decorators as you want, and for convenience, you can define the 
intercepter function as decorator and manually call `before` and `after` inside 
it, please check the example of module 
[sfn-validate-decorator](https://github.com/hyurl/sfn-validate-decorator).

## Horizontal Inheritance (Mixins)

**Mixins** allows you inherit methods and properties from multiple classes 
instead of only the supper class. To use mixins, you will need to install 
another package [class-mixins](https://github.com/hyurl/class-mixins), you 
should check out its documentation to be more understood it features.

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