<!-- title: app; order: 15.3 -->

## app

The main entry and root namespace of the application.

## app.ROOT_PATH

- \<string\> The root path of the application.

## app.SRC_PATH

- \<string\> The source code path of the application.

## app.APP_PATH

- \<string\> The real path of the application, usually it's the `dist` directly.

alias: `app.path`.

## app.version

- \<string\> The version number set in the project's package.json.

## app.id

- \<string\>

In the web server, the app ID would be either `web-server`, or `web-server-<n>`
when started with PM2, where `<n>` is the `process.env.NODE_APP_INSTANCE`; in an
RPC server, the app ID is the ID passed to `app.serve()`, which is also the ID
set in `app.config.server.rpc`.

NOTE: the ID will only be available until the server has started.

## app.isDevMode

- \<boolean>

Whether the application runs in development mode, if the application is run via
PM2, it will be considered running in production mode.

## app.isDebugMode

- \<boolean\>

Whether the application runs in debug mode (whether by VS Code, WebStorm or
Other IDEs).

## app.isTsNode

- \<boolean\> Whether the application runs in
    [ts-node](https://github.com/TypeStrong/ts-node).

## app.isCli

- \<boolean\> Whether the application is run as command line program.

## app.isScript

- \<boolean\>

Whether the current process runs as a script, scripts is run via the command
`npx sfn <filename>`.

## app.isWebServer

- \<boolean\>

Whether the current process runs as a web server, it's `false` by default, and
become `true` once `app.serve()` is called to ship the web server.

## app.serve

Starts the web server (both `http` and `ws`) or an RPC server if `id` is
provided.

```ts
function serve(id?: string): Promise<void>;
```

## app.router

- [\<webium.App\>](https://github.com/hyurl/webium#app) (Web server only)
    The basic HTTP router created by **webium** framework.

## app.http

- [\<HttpServer\>](https://nodejs.org/dist/latest-v15.x/docs/api/http.html#http_class_http_server)
    | [\<HttpsServer\>](https://nodejs.org/dist/latest-v15.x/docs/api/https.html#https_class_https_server)
    | [\<Http2SecureServer\>](https://nodejs.org/dist/latest-v15.x/docs/api/http2.html#http2_class_http2server)
    (Web server only) The HTTP server.

## app.ws

- [\<SocketIO.Server\>](https://socket.io/docs/server-api/#Server)
    (Web server only) The WebSocket server created by **socket.io** framework.

## app.rpc

### app.rpc.server

The RPC server instance, only available when the current process is an RPC
server (and the server is running), if it's a web server, the variable will be
`null`.

### app.rpc.serve

Starts an RPC server according to the given `id`, which is set in
`app.config.server.rpc`.

This function is similar to `app.serve()`.

### app.rpc.connect

Connects to an RPC server according to the given `id`, which is set in
`app.config.server.rpc`. If `defer` is `true`, when the server is not online,
the function will hang in the background until it becomes available and finishes
the connection.

```ts
function connect(id: string, defer?: boolean): Promise<void>;
```

### app.rpc.connectAll

Connects to all RPC servers.

```ts
function connectAll(defer?: boolean): Promise<void>;
```

### app.rpc.connectDependencies

Connects to all dependency services, by default, `id` is the `app.id`, and don't
have to pass it. But if the `app.id` is not set in `config.server.rpc`, it needs
to be provided explicitly.

```ts
function connectDependencies(id?: string): Promise<void>;
```

### app.rpc.isConnectedTo

Checks if the target server is connected.

```ts
function isConnectedTo(id: string): boolean;
```
