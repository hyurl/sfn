<!-- title: 命令行和解释器; order: 7 -->
## 设计目的

为了使编程更迅速，**SFN** 提供了一些控制台命令，你可以在 shell 或者 CMD 中使用它们，
来为你生成需要的文件，与服务器交互等。它们数量很少，并且容易学习。

要启用这个特性，你需要配置一下你的电脑，使其支持 NodeJS 命令行程序。你只需要将模块
目录添加进操作系统的环境变量 `PATH` 即可。

### Windows

在你的资源管理器地址栏中输入这个位置：`控制面板\系统和安全\系统`，然后点击左边菜单栏
的 **高级系统设置**，在弹出来的 **系统属性** 对话框中，切换到 **高级** 选项卡页面，
点击下面的 **环境变量**，然后在 **用户变量** 中找到并选中 **Path** 项，点击 
**编辑**，修改它，在前面加上 `.\node_modules\.bin`。如果 **Path** 变量不存在，你
可以手动创建一个，或者修改 **系统变量** 中的 **Path**。

### Linux

打开一个终端，然后使用命令 `vim ~/.bashrc` 来编辑用户配置文件，在内容的后面加上一行
`export PATH="./node_modules/.bin:$PATH"`，保存后使用 `source ~/.bashrc` 来重新
加载该配置。

如果你不熟悉 `vim`，你也可以用可视化文本编辑器来编辑这个文件。

### Mac OS

打开一个终端，然后使用命令 `vi ~/.bash_profile` 来编辑用户配置文件，在内容的后面
加上一行 `export PATH=./node_modules/.bin:$PATH`，保存后使用 
`source ~/.bash_profile` 来重新加载该配置。

如果你不熟悉 `vi`，你也可以用可视化文本编辑器来编辑这个文件。

## 命令

### `sfn init`

初始化项目并自动创建需要的文件。这个命令应该在安装框架之后就立即运行，但是也可以用来恢复
应用必需的文件，如果它们丢失了。

### `sfn -c <name> [-t <type>]`

根据给定的名称创建控制器文件。

```sh
sfn -c article
```

这个命令将会创建一个名为 `article.ts` 的文件并存储在 `src/controllers/` 目录下。

默认地，这个命令会创建一个 HttpController，你可以指定 `-t <type>` 选项来生成不同
类型的地控制器，例如：

```sh
sfn -c articleSocket -t websocket
```

这个命令将创建一个 WebSocketController。

### `sfn -s <name>`

根据给定的名称创建一个新的服务。

```sh
sfn -s tool
```

这个命令将会创建一个名为 `tool.ts` 的文件并存储在 `src/services/` 目录下。

### `sfn -l <name>`

根据指定的名称创建一个新的语言包。语言包文件命名基于
[RFC 1766](https://www.ietf.org/rfc/rfc1766.txt) 标准。

```sh
sfn -l zh-CN
```

这个命令将创建一个名为 `zh-CN.json` 的文件并存储在 `src/locales/` 目录下，如果默认
的语言包使可用的，那么新的语言包将会自动引用它，你所需要做的，就是进行翻译而已。

## REPL

从 0.5.2 版本起，SFN 提供了一个 REPL 窗口来允许你连接到正在运行的进程并进行交互，和 Node.js
内置的 REPL 非常相似，你可以在 REPL 中运行任何合法的 JavaScript 代码，但与内置 REPL 在本地
执行代码不同，SFN REPL 会将输入重定向到你想要的指定服务器进程中，来直接和该进程进行交互。

要打开这个 REPL 窗口，只需要在终端输入命令 `sfn repl <appId>` 即可，`<appId>` 则
表示你希望连接的服务器，例如 `sfn repl web-server` 将会把 REPL 会话连接到
web-server。一旦 REPL 准备完成，你就可以做几乎任何你在内置 REPL 中所熟悉的事情（Tab 快捷
提示除外）。

另外，如果你不希望标准输入输出被传送到 REPL 中，则可以使用 `--no-stdout` 参数来规避，
通常情况下这很有用，因为在项目运行时，可能会有很多内容被输出到 stdout 中，例如 `console.log`。

### `await` 操作符支持

SFN REPL 提供了完整的最上层 `await` 操作符支持，因此你可以自由地使用这个关键字来处理任何异步
的操作并打印出最终结果，就如同你在 Chrome 控制台中那样操作。