<!-- title: 起步; order: 1 -->

>这份文档仅适合 SFN 0.5.x 版本，如果想要查阅旧版本 SFN 的文档，请
>[点击这里](/docs/v0.4.x/getting-started)。

### 初始化你的项目

创建一个目录以便存储关于你的项目的文件，然后使用这个命令

```sh
npm init
```
来初始化你的项目，假设你已经对 [NPM](https://www.npmjs.com/) 有了一定的理解并安装了
[NodeJS](https://nodejs.org) 环境。

### 安装 TypeScript 编译器和运行时

**SFN** 是使用 [TypeScript](https://www.typescriptlang.org) 编写的，因此你也应该
使用它来编写你的代码。

*运行时 [ts-node](https://github.com/TypeStrong/ts-node) 是可选的，只有在你希望不编译*
*而直接运行程序时才需要。*

```sh
npm i -g typescript
npm i -g ts-node
```

### 安装 PM2（可选）

自 0.3.x 版本起，SFN 使用 [PM2](https://pm2.io) 作为其应用管理器和负载均衡器，因此为了使
你的应用更好地部署，你也应当安装 PM2 并使用其来启动你的应用（当然这是生产环境的需求，开发环境中
这并不是必须的）。

```sh
npm i -g pm2
```

### 安装框架
当你初始化项目完成之后，你现在就可以安装 **SFN** 框架了，请使用下面的命令：

```sh
npm i sfn
```

在所有文件都下载完成后，输入下面的命令来初始化你的项目，它将会自动地为你创建需要地文件和
目录。

但在你执行这个过程前，你需要设置好环境从而使计算机可以运行用户自定义的 NodeJS 命令行程序。
详情请查看 [命令行](./command-line).

```sh
sfn init
```

### 启动服务器示例

**SFN** 提供了一个简单的示例，因此你可以立马开启服务器并观察将会发生什么。

如果你已经安装了 **ts-node**，那么则可以直接使用下面的命令来启动项目：

```sh
ts-node src
```

否则，使用命令 `tsc` 编译源代码，然后运行这个命令：

```sh
node dist
```

接着，服务器将会在几秒钟之内完成启动。

如果你安装了 PM2，则可以使用下面的命令来启动服务器，并按照 CPU 核心数自动规模化部署：

```sh
pm2 start dist/index.js -i max
```