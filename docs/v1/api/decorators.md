<!-- title: decorators; order: 16 -->

## decorators

This section includes all decorators exposed by SFN that can be used in user
code.

## route

Binds the method to a specified URL route.

```ts
function route(path: string): HttpDecorator;
function route(method: HttpMethods | "SSE", path: string): HttpDecorator;
```

where `HttpDecorator` is

```ts
(proto: HttpController, prop: string) => void;
```

- [\<HttpController\>](./HttpController)

This decorator includes the following short-cuts:

- route.delete

```ts
route.delete = (path: string) => HttpDecorator;
```

- route.get

```ts
route.get = (path: string) => HttpDecorator;
```

- route.head

```ts
route.head = (path: string) => HttpDecorator;
```

- route.patch

```ts
route.patch = (path: string) => HttpDecorator;
```

- route.post

```ts
route.post = (path: string) => HttpDecorator;
```

- route.put

```ts
route.put = (path: string) => HttpDecorator;
```

- route.sse

```ts
route.sse = (path: string) => HttpDecorator;
```

## event

Binds the method to a specified socket event.

```ts
function event(name: string): (proto: WebSocketController, prop: string) => void;
```

- [\<WebSocketController\>](./WebSocketController)

## requireAuth

Requires authentication when calling the method.

```ts
function requireAuth(proto: Controller, prop: string) => void;
```

- [\<Controller\>](./Controller)

## Sting Tags

### grey

Use this functions as a string tag with console functions to print a string
in grey color with date-time string prefixed.

```ts
function grey(callSite: TemplateStringsArray, ...bindings: any[]): string;
```

### green

Use this functions as a string tag with console functions to print a string
in green color with date-time string prefixed.

```ts
function green(callSite: TemplateStringsArray, ...bindings: any[]): string;
```

### yellow

Use this functions as a string tag with console functions to print a string
in yellow color with date-time string prefixed.

```ts
function yellow(callSite: TemplateStringsArray, ...bindings: any[]): string;
```

### red

Use this functions as a string tag with console functions to print a string
in red color with date-time string prefixed.

```ts
function red(callSite: TemplateStringsArray, ...bindings: any[]): string;
```
