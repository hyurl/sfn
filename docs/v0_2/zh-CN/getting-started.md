<!-- title: 起步; order: 1 -->
### 初始化你的项目

创建一个目录以便存储关于你的项目的文件，然后使用这个命令

```sh
npm init
```
来初始化你的项目，假设你已经对 [NPM](https://www.npmjs.com/) 有了一定的理解并安装了
[NodeJS](https://nodejs.org) 环境。

### 安装 TypeScript

**SFN** 是使用 [TypeScript](https://www.typescriptlang.org) 编写的，因此你也应该
使用它来编写你的代码，但这并不是必须的，后面我们会讲到这一点。

```sh
npm i -g typescript
```

如果你对 TypeScript 还不了解，你可能需要自己首先去学习它，但如果你不打算使用它，这个
步骤则可以跳过。

### 启用 TypeScript 支持

要为你的项目开启 TypeScript 支持，只需要添加一个新文件，名为 
[tsconfig.json](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html)
到你的项目目录下，它的内容应该类似下面这样：

```json
{
    "compilerOptions": {
        "module": "commonjs",
        "target": "es2015",
        "preserveConstEnums": true,
        "rootDir": "src/",
        "outDir": "dist/",
        "newLine": "LF",
        "experimentalDecorators": true,
        "emitDecoratorMetadata": true,
        "sourceMap": true,
        "importHelpers": true,
        "pretty": true,
        "removeComments": true,
        "lib": [
            "es2015",
            "es2016.array.include"
        ]
    },
    "files": [
        "src/index.ts",
        "src/config.ts"
    ],
    "include": [
        "src/controllers/*.ts",
        "src/controllers/*/*.ts",
        "src/bootstrap/*.ts",
        "src/locales/*.ts",
        "src/models/*.ts"
    ],
    "exclude": [
        "node_modules/*"
    ]
}
```

你也可以简单地复制这个示例，它已经满足了大多数情况。如果 `tsconfig.json` 缺失，那么
框架将会运行在纯 JavaScript 环境中。

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

**SFN** 提供了一个简单的示例，因此你可以立马开启服务器并观察将会发生什么。首先，使用
命令 `tsc` 编译源代码（仅 TypeScript），然后输入这个命令：

```sh
sfn start
```

接着，服务器将会在几秒钟之内完成启动。