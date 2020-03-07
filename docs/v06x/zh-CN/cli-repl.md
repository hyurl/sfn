<!-- title: 命令行和解释器; order: 7 -->
## 设计目的

为了使编程更迅速，**SFN** 提供了一些控制台命令，你可以在 shell 或者 CMD 中使用它们，
来为你生成需要的文件，与服务器交互等。它们数量很少，并且容易学习。

**SFN v0.6 建议使用 `npx` 来执行命令。**

**注：下列命令中，`[]` 标水参数可选，`<>` 表示参数必需。**

## 命令

### `sfn init`

初始化项目并自动创建需要的文件。这个命令应该在安装框架之后就立即运行，但是也可以用来恢复
应用必需的文件，如果它们丢失了。

### `sfn -c <name> [-t <type>]`

根据给定的名称创建控制器文件。

```sh
npx sfn -c article
```

这个命令将会创建一个名为 `article.ts` 的文件并存储在 `src/controllers/` 目录下。

默认地，这个命令会创建一个 HttpController，你可以指定 `-t <type>` 选项来生成不同
类型的地控制器，例如：

```sh
npx sfn -c articleSocket -t websocket
```

这个命令将创建一个 WebSocketController。

### `sfn -s <name>`

根据给定的名称创建一个新的服务。

```sh
npx sfn -s tool
```

这个命令将会创建一个名为 `tool.ts` 的文件并存储在 `src/services/` 目录下。

### `sfn -l <name>`

根据指定的名称创建一个新的语言包。语言包文件命名基于
[RFC 1766](https://www.ietf.org/rfc/rfc1766.txt) 标准。

```sh
npx sfn -l zh-CN
```

这个命令将创建一个名为 `zh-CN.json` 的文件并存储在 `src/locales/` 目录下，如果默认
的语言包使可用的，那么新的语言包将会自动引用它，你所需要做的，就是进行翻译而已。

## REPL

从 0.5.2 版本起，SFN 提供了一个 REPL 窗口来允许你连接到正在运行的进程并进行交互，和 Node.js
内置的 REPL 非常相似，你可以在 REPL 中运行任何合法的 JavaScript 代码，但与内置 REPL 在本地
执行代码不同，SFN REPL 会将输入重定向到你想要的指定服务器进程中，来直接和该进程进行交互。

要打开这个 REPL 窗口，只需要在终端输入命令 `sfn [repl] <appId>` 即可，`<appId>` 则
表示你希望连接的服务器，例如

```sh
npx sfn web-server
```

将会把 REPL 会话连接到 web-server。一旦 REPL 准备完成，你就可以做几乎任何你在内置 REPL
中所熟悉的事情（Tab 快捷提示除外）。

另外，如果你不希望标准输入输出被传送到 REPL 中，则可以使用 `--no-stdout` 参数来规避，
通常情况下这很有用，因为在项目运行时，可能会有很多内容被输出到 stdout 中，例如 `console.log`。

### `await` 操作符支持

SFN REPL 提供了完整的最上层 `await` 操作符支持，因此你可以自由地使用这个关键字来处理任何异步
的操作并打印出最终结果，就如同你在 Chrome 控制台中那样操作。

## 运行脚本

自 v0.6.40 起，SFN 现在支持当服务器运行时执行一个外部脚本，与直接通过 `node` 命令来执行脚本
不同，使用下面的命令与徐程序在真正执行脚本之前，连接到任何正在活跃的 RPC 服务器。

```sh
npx sfn src/script/test.ts
```

*注意：你可以直接将 TypeScript 的源文件名传入，但它必须经过编译成 JavaScript 才能够被运行。*
