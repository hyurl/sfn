<!-- title: CLI & REPL; order: 7 -->
## Purpose

To make programming fast, **SFN** provides some commands, you can use them in
the shell or CMD, to generate needed files, to interact with the servers, etc.
They're few and easy to learn.

**Since v0.6, it's recommended using `npx` to run commands.**

**NOTE: In the following commands, `[]` indicates the argument is optional, and**
**`<>` indicates the argument is required.**

## Commands

### `sfn init`

Initiates the project and create needed files. This command should be run right
after you install the framework. But you can also run it to recover
must-be-present files when any missing.

### `sfn -c <name> [-t <type>]`

Creates a controller file according to the specified name.

```sh
npx sfn -c article
```

This command should create a file named `article.ts` in `src/controllers/` 
directory.

By default, this command will generate a HttpController, you can specify the 
`-t <type>` option to generate different type of controllers, e.g.

```sh
npx sfn -c articleSocket -t websocket
```

This command will create a WebSocketController.

### `sfn -s <name>`

Creates a new service according to the specified name.
```sh
npx sfn -s tool
```

This command should create a file named `tool.ts` in `src/services/` directory.

### `sfn -l <name>`

Creates a language pack according to the specified name. Language packs are 
named according to [RFC 1766](https://www.ietf.org/rfc/rfc1766.txt) standard.

```sh
npx sfn -l zh-CN
```

This command should create a file named `zh-CN.json` in `src/locales/` directory,
if the default language pack is available, the new pack will reference to it and
all you need to do is just translation.

## REPL

Since version 0.5.2, SFN provides a REPL window to allow you to attach and
interact with the running processes, very similar to Node.js built-in REPL, you 
can run any valid JavaScript code in the REPL, but unlike the built-in REPL runs
code locally, SFN REPL will redirect the input to the corresponding
server process you wished, to interact directly with that process.

To open the REPL window, simply type the command `sfn [repl] <appId>` in the
terminal, where the `<appId>` is the server you wish to attach, e.g.

```sh
npx sfn web-server
```

will attach the REPL session to the web-server. Once the REPL is ready, you can
do almost everything you familiar with the built-in REPL (Except for `Tab`-key
fast hint).

Another tip, if you don't want any standard output content being transmitted to
the REPL, you can use the option `--no-stdout` to prevent it, this is very
useful since there may be many data being written to the stdout during runtime,
e.g. `console.log`.

### `await` Operator Support

SFN REPL provides full support of top-level `await` operator, so you're free
to use this keyword to resolve any async operation and prints the final result
just like you would do in the Chrome Console.

## Run Script

Since v0.6.40, SFN now supports running a external script while the server is
serving, unlink executing the script directly by `node` command, using the
following command will allow it to trigger startup hooks and connect to any
alive RPC services before actually running the script.

```sh
npx sfn src/script/test.ts
```

*NOTE: you can pass the source TypeScript filename directly, but it must be*
*compiled to JavaScript first in order to be able to run.*
