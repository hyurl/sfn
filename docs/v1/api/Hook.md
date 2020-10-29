<!-- title: Hook; order: 2 -->

## Hook

The base class used to create hook instance when accessing hook chains.

This class is not intended to be used directly, instead, use it as an interface
to annotate variables and use the `app.hooks` namespace to get instance instead.

```ts
abstract class Hook<I = void, O = void> { }
```

## Properties

- `name` \<string\> The name of the hook, when accessing a hook via `app.hooks`,
    this property will be set automatically.

## Methods

### bind

Binds a handler function to the current hook.

```ts
bind(handler: (input?: I, output?: O) => void | O | Promise<void | O>): this;
```

### invoke

Invokes all handler functions bound to the hook.

```ts
invoke(input?: I, output?: O): Promise<O>
```

### decorate

Uses the hook as a method decorator, when doing this, the arguments passed to
the handlers will be the same ones passed to the method, and any returning value
form the handlers will be ignored.

```ts
decorate(): MethodDecorator
```

### getHandlers

Returns all handler functions bound to the current hook.

```ts
getHandlers(): Function[];
```

## app.hooks.lifeCycle

### app.hooks.lifeCycle.startup

This internal hooks is used in the system startup procedure, you can bind
functions for extra initiation of your program.

### app.hooks.likeCycle.shutdown

This internal hooks is used in the system shutdown procedure, you can bind
functions for extra destruction of your program.
