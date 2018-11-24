<!-- title: 起步; order: 1 -->

>这份文档仅适合 SFN 0.4.x 版本，如果想要查阅旧版本 SFN 的文档，请
>[点击这里](/docs/v0.3.x/getting-started)。

### 初始化你的项目

创建一个目录以便存储关于你的项目的文件，然后使用这个命令

```sh
npm init
```
来初始化你的项目，假设你已经对 [NPM](https://www.npmjs.com/) 有了一定的理解并安装了
[NodeJS](https://nodejs.org) 环境。

### 安装 TypeScript

**SFN** 是使用 [TypeScript](https://www.typescriptlang.org) 编写的，因此你也应该
使用它来编写你的代码。

```sh
npm i -g typescript
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

在所有文件都下载完成后，SFN 会初始化你的项目，并自动地为你创建需要地文件和目录。

### 启动服务器示例

**SFN** 提供了一个简单的示例，因此你可以立马开启服务器并观察将会发生什么。首先，使用
命令 `tsc` 编译源代码，然后输入这个命令：

```sh
node dist
```

接着，服务器将会在几秒钟之内完成启动。

如果你安装了 PM2，则可以使用下面的命令来启动服务器，并按照 CPU 核心数自动规模化部署：

```sh
pm2 start dist/index.js -i max
```