## 0.1.14

## Fixes

- Fix a bug in `MarkdownParser` (and `HttpController.viewMarkdown()`).

# 0.1.13

## Fixes

- Fix the bug that after calling `res.end()`, `res.send()` or `res.redirect()`,
    the framework will still try to send data.

## New Features

- **DI (Dependency Injection)** support for controllers, now can set URL params
    as method parameter, and pass `req: Request`, `res: Response`, or 
    `socket: WebSocket` in arbitrary orders.
- Add two special methods `Controller.before()` and `Controller.after()` to 
    handle any operations before and after the actual method is called.

# 0.1.12

## Fixes

- Fix a bug in command-line execution.

# 0.1.11

## Fixes

- Fix the bug of `@requireAuth` not working with `WebSocketController`s.

## New Features

- Expose/load entities more reasonably, many variables, constants and 
    functions are now available in `config.ts`. 
- `DevWatcher` will delay restarting the server when more than one file are 
    changed at once.
- Support `.env` file (in `ROOT_PATH`).

# 0.1.3

## Changes

- `config.staticPath` => `config.statics` support multiple directories.
- `config.server.host` => `config.server.hostname`
- `config.server.port` => `config.server.http.port`
- `config.server.socket` => `config.server.websocket`

## New Features

- `config.awaitGenerator` Allows generator method in a controller being called
    as a coroutine function.