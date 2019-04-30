<!-- title: CLI & REPL; order: 7 -->
## Purpose

To making programming fast, **SFN** provides some commands, you can use them 
in the shell or CMD, to generate needed files, to interact with the servers, etc. 
They're few and easy to learn.

To enable this feature, you need to configure your computer a little bit, so 
that it can support NodeJS command line program. All you need to do is 
adding the module directory into the environment variable `PATH`.

### Windows

In you file explorer's location bar, input this path: 
`Control Panel\System and Security\System`, then click **Advanced system** 
**settings** on the left sidebar, in the popup **System Properties** dialog, 
go to **Advanced** tab, click **Environment Variables...** on the bottom, find
and select **Path** in **User variables**, click **Edit** to modify it, add a 
new item of `.\node_modules\.bin` on the top. If **Path** doesn't exist, you 
can manually create a new one or edit the one in **System variables**.

### Linux

Open a terminal, then use the command `vim ~/.bashrc` to edit user 
configuration file, add a new line on the bottom with contents: 
`export PATH="./node_modules/.bin:$PATH"`, save it and use the command 
`source ~/.bashrc` to reload the configuration.

If you're not familiar with `vim`, you can use a visual editor instead.

### Mac OS

Open a terminal, then use the command `vi ~/.bash_profile` to edit user 
configuration file, add a new line on the bottom with contents: 
`export PATH=./node_modules/.bin:$PATH`, save it and use the command 
`source ~/.bash_profile` to reload the configuration.

If you're not familiar with `vi`, you can use a visual editor instead.

## Commands

### `sfn init`

Initiates the project and create needed files. This command should be run right
after you install the framework. But you can also run it to recover 
must-be-present files when any missing.

*In history versions, SFN once provided some commands like **start**, **stop**,*
*and **reload** to inactive with the program. But since 0.3.0, SFN started being*
*friendly to [PM2](https://pm2.io), and use PM2 as its load balancer, so those*
*commands has been removed. Please check the documentation of PM2 for how to*
*inactive with the application.*

### `sfn -c <name> [-t <type>]`

Creates controller file according to the specified name. In a **SFN** 
application, I recommend you name your class file as **CamelCase** style with
a leading upper-cased character.

```sh
sfn -c Article
```

This command should create a file named `Article.ts` in `src/controllers/` 
directory.

By default, this command will generate a HttpController, you can specify the 
`-t <type>` option to generate different type of controllers, e.g.

```sh
sfn -c ArticleSocket -t websocket
```

This command will create a WebSocketController.

### `sfn -m <name>`

Creates a new model according to the specified name. **SFN** uses 
[Modelar](https://github.com/hyurl/modelar) as its ORM system, so you need to 
learn it as well.

```sh
sfn -m User
```

This command should create a file named `User.ts` in `src/models/` directory.
Be aware, the **User** class has special meaning in **SFN**, it is internally 
used by the auto-authorization system of the framework, which gives you the 
ability to accept or reject requests from a client.

### `sfn -s <name>`

Creates a new service according to the specified name.
```sh
sfn -s Tool
```

This command should create a file named `Tool.ts` in `src/services/` directory.

### `sfn -l <name>`

Creates a language pack according to the specified name. Language packs are 
named according to [RFC 1766](https://www.ietf.org/rfc/rfc1766.txt) standard.

```sh
sfn -l zh-CN
```

This command should create a file named `zh-CN.json` in `src/locales/` 
directory, if the default language pack is available, the new pack will 
reference to it, and all you need to do is just translation.

## REPL

Since version 0.5.2, SFN provides an REPL window to allow you attach and
interact with the running processes, very similar to Node.js built-in REPL, you 
can run any valid JavaScript code in the REPL, but unlike the built-in REPL runs
code locally, SFN REPL will redirect the input to the corresponding server
process you wished, to interact directly with that process.

To open the REPL window, simply type the command `sfn repl <serverId>` in the
terminal, where the `<serverId>` is the server you wish to attach, e.g. 
`sfn repl web-server-1` will attach the REPL session to the web-server-1. Once
the REPL is ready, you can do almost everything you familiar with the built-in
REPL.

Another tip, if you don't want any standard output content being transmitted to
the REPL, you can use option `--no-stdout` to prevent it, this is very useful 
since there may be many data being written to the stdout during runtime, e.g.
`console.log`.

### `await` Operator Support

SFN REPL provide fully support of top level `await` operator, so you're free
to use this keyword to resolve any async operation and prints the final result
just like you would do in the Chrome Console.