<!-- title: Controller; order: 7 -->

## Controller

The is the base class of `HttpController` and `WebSocketController`, it gives
you a common API to return data to the underlying response context, all
controllers will be automatically handled by the framework, you don't have to
create instance for them.

```ts
abstract class Controller extends Service { }
```

- [\<Service\>](./Service)

## Properties

- `authorized` \<boolean\> Indicates whether the operation is authorized.
- `session` [\<Session\>](./Session) The session of the current request/websocket context.

## Methods

### success

Returns a result indicates the operation is succeeded.

```ts
success<T = any>(data: T, code: number = 200): ResultMessage<T>;
```

where <code id="ResultMessage">ResultMessage</code> is:

```ts
interface ResultMessage<T = any> {
    success: boolean;
    code: number;
    data?: T;
    error?: string;
}
```

### fail

Returns a result indicates the operation is failed.

```ts
fail(msg: string | Error, code: number = 500): ResultMessage<void>;
```

NOTE: this method is originally called `error()`, but now it's been deprecated,
use the new method name instead.
