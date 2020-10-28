<!-- title: Config; order: 15.2 -->

### Config

This interface includes all possible options that can be set in the
configuration file or via `app.config` entry.

NOTE: This interface is not exposed directly, it's augmented into the global
`app` namespace, so use `app.Config` instead, further more, you can augment any
number of options into this interface is you want.

```ts
interface app.Config { }
```

### lang

- \<string\> Default language of the application.

### saveSchedules

- \<boolean> Save schedules when the system shuts down and rebuild after reboot.

### statics

- \<string\> | \<{ [path: string]: [StaticOptions](#StaticOptions) }\>

where <code id="StaticOptions">StaticOptions</code> is:

```ts
interface StaticOptions extends serveStatic.ServeStaticOptions {
    /** 
     * If `true`, the URL must contain the folder name (relative to `SRC_PATH`) 
     * as prefix to reach the static resource. Also you can set a specified 
     * prefix other than the folder name.
     */
    prefix?: boolean | string;
    setHeaders?: (res: ServerResponse, path: string, stat: Stats) => void;
};
```

- [\<serveStatic.ServeStaticOptions\>](https://github.com/expressjs/serve-static#options)

### watch

Watch modules and when files changed, refresh the memory cache and hot-reload
the module.

NOTE: **DO NOT** import the module statically in anywhere, otherwise it may not
be reloaded as expected.

- <{ watch: (...args: any[]) => [chokidar.FSWatcher](https://github.com/paulmillr/chokidar#methods--events) }[]>

### server

Includes settings related to the web server or RPC servers.

#### server.hostname

- \<string\> | \<string[]\> Host name(s), used for calculating the sub-domain.

#### server.http

Includes the settings of the HTTP(s/2) server.

##### server.http.type

Sets the server type, possible values are:

- `http` (default)
- `https`
- `http2`

##### server.http.port

- \<number\> Sets the server port, default value is `80`.

##### server.http.timeout

- \<number\> Sets the default request timeout, default value is `120000` ms.

##### server.http.options

- \<object\> These options are mainly for type `http` and type `http2`.
    - [\<http.ServerOptions\>](https://nodejs.org/dist/latest-v15.x/docs/api/http.html#http_http_createserver_options_requestlistener)
    - [\<https.ServerOptions\>](https://nodejs.org/dist/latest-v15.x/docs/api/https.html#https_https_createserver_options_requestlistener)
    - [\<http2.ServerOptions\>](https://nodejs.org/dist/latest-v15.x/docs/api/http2.html#http2_http2_createsecureserver_options_onrequesthandler)

#### server.websocket

Includes the options of the WebSocket server.

##### server.websocket.enabled

- \<boolean\> Whether or not to turn on the WebSocket server.

##### server.websocket.port

- \<number\> By default, this `port` is `0` or `undefined`, that means it will
    attach to the HTTP server instead. If you change it, it will listen to that
    port instead.

##### server.websocket.options

- \<object\> These options are used for socket.io.
    - [\<SocketIO.ServerOptions\>](https://socket.io/docs/server-api/#new-Server-options)

#### server.rpc

- \<{ [appId: string]: object }\> Includes the settings of the RPC servers.
    - [\<microse.ChannelOptions\>](https://github.com/microse-rpc/microse-node/blob/master/docs/api.md#channeloptions)
    - [\<microse.ClientOptions\>](https://github.com/microse-rpc/microse-node/blob/master/docs/api.md#clientoptions)
    - `services` [\<ModuleProxy[]\>](https://github.com/microse-rpc/microse-node/blob/master/docs/api.md#moduleproxy)
        The services that should be hosted by this server.
    - `dependencies` <"all"> | [\<ModuleProxy[]\>](https://github.com/microse-rpc/microse-node/blob/master/docs/api.md#moduleproxy)
        The services that this server depended on. (hosted ones excluded.)
