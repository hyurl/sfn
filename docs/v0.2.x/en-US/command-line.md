<!-- title: Command Line; order: 7 -->
## Purpose

To making programming fast, **SFN** provides some commands, you can use them 
in the shell or CMD, to generate needed files, to start and stop servers, etc. 
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

### `sfn start [--daemon]`

Starts service. After this command is executed, the master process will be 
started and it will fork workers to start web service. If the option `daemon` is
provided, the console process will exit immediately, but keep the server running
in the background.

### `sfn list`

Lists out all running workers in a table.

```sh
sfn list
# will output like this:
# +----------+---------+----------+----------+----------+---------------+-----+
# |    id    |   pid   |  state   |  reboot  |  uptime  |    memory     | cpu |
# +----------+---------+----------+----------+----------+---------------+-----+
# |  master  |  14196  |  online  |    0     |  49m50s  |   26.293 Mb   | 0 % |
# +----------+---------+----------+----------+----------+---------------+-----+
# |    A     |  13264  |  online  |    2     |  49m46s  |   66.414 Mb   | 0 % |
# +----------+---------+----------+----------+----------+---------------+-----+
```

### `sfn stop [-t <timeout>]`

Stops service. After this command is executed, whether the server is running in
the foreground or background, it will stop safely. The workers may refuse to 
stop if there are unclosed connections, especially with WebSocket, setting up 
`timeout` (default is `5` seconds) to force the worker to close the server no 
matter what.

```sh
sfn stop -t 10 # force the application to stop in 10 seconds
```

### `sfn reload [-t <timeout>]`

Reloads service. After this command is executed, the hosted workers will be 
restarted gracefully, and keep the server available when reloading, so that 
clients will not lost connections to it. The workers may refuse to stop if there
are unclosed connections, especially with WebSocket, setting up `timeout` 
(default is `5` seconds) to force the worker to close the server no matter what.
This command only reloads workers, the master will be stand still.

```sh
sfn reload -t 10 # force the application to reload service in 10 seconds
```

### `sfn restart [-t <timeout>]`

Restarts the application, this command is practically the same as running 
`sfn stop` and `sfn start --daemon`.

### `sfn [command] -h`

Displays the help information. If the `command` is provided, it will output the 
usage information of that command instead.

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

### `sfn -l <name>`

Creates a language pack according to the specified name. Language packs are 
named according to [RFC 1766](https://www.ietf.org/rfc/rfc1766.txt) standard.

```sh
sfn -l zh-CN
```

This command should create a file named `zh-CN.json` in `src/locales/` 
directory, if the default language pack is available, the new pack will 
reference to it, and all you need to do is just translation.