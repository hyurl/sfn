# 0.1.3

## Changes

- `config.staticPath` => `config.statics` support multiple directories.
- `config.server.host` => `config.server.hostname`
- `config.server.port` => `config.server.http.port`
- `config.server.socket` => `config.server.websocket`

## New Features

- `config.awaitGenerator` Allows generator method in a controller being called
    as a coroutine function.