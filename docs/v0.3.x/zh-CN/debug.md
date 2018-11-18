<!-- title: IDE 调试; order: 7.1 -->

# 基本概念

在开发阶段，使用 IDE 调试应用是被建议的。SFN 支持许多的方式进行调试，并且配置也很容易设置。

# 在 Visual Studio Code 中调试

### 配置调试

SFN 提供了一个简单的适用于 **Visual Studio Code** 进行调试的方案，如果你是刚开始安装 SFN 
框架，并且你的工作目录下有一个 `.vscode` 文件夹，框架会自动生成用于调试的配置文件 
`launch.json`。如果文件已经存在，或者 `.vscode` 文件夹不存在，那么将不会自动生成。你可以
自己创建这个文件，或者直接点解编辑器菜单按钮中的 **【调试】** >> **【打开配置】**，编辑器将会
自动生成用于配置调试的模板文件，你只需要将其配置成类似下面这样，就可以使用调试了：

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "node",
            "request": "launch",
            "protocol": "auto",
            "name": "启动服务器",
            "program": "${workspaceFolder}/dist/index"
        }
    ]
}
```

Visual Studio Code 调试是直接支持 TypeScript 的，因此你可以直接在源文件上设置断点什么
的，这一切，和调试纯 JavaScript 项目没什么大的区别。

<img src="/images/vscode-debug.png" alt="Debug Panel" title="Debug Panel" width="auto" />

注意如果你没有使用 TypeScript 来进行开发，请记得把 
`${workspaceFolder}/dist/index` 修改为 `${workspaceFolder}/src/index`。

更多关于 Visual Studio Code 调试应用的详情，请查阅
[Debugging in Visual Studio Code](https://code.visualstudio.com/docs/editor/debugging)。

# 在 WebStorm 中调试

### 配置调试

在 WebStorm 中为 SFN 配置调试器也是非常简单的，它也拥有内置的 TypeScript 支持。首先，在一个
WebStorm 窗口中打开你的项目目录，点击顶部菜单栏的 **Run** 按钮，然后选择 
**Add/Edit Configuration** 选项，这是回弹出一个配置窗口。

点击加号 **+** 按钮，选择项目 **Node.js**，然后编辑器会询问你填写项目的详细信息，选择
**Working directory** 和 **JavaScript file**，设置成如下面这样，点击 **OK** 就可以了。

<img src="/images/webstorm-debug.png"/>

### 自动编译 TypeScript

如果你正在使用 TypeScript 编程，你可能会想要在调试时自动编译你的项目，你只需要做下面这些步骤。

<img src="/images/webstorm-debug-compile.png" style="display:inline-block;vertical-align:top"/>

<img src="/images/webstorm-debug-compile2.png" style="display:inline-block;vertical-align:top"/>

### 开始调试应用

一旦设置好，你就可以点击窗口右上角的 **Debug** 按钮进行调试了。

<img src="/images/webstorm-debug2.png"/>

然后你就会看到下面这个控制台，上面写道应用已成功启动并运行在调试模式中。

<img src="/images/webstorm-debug3.png"/>

### 设置和触发断点

你可以在源代码中设置断点，然后打开浏览器访问一定会触发断点的的链接，之后你将会看到类似下面这样的
结果显示在编辑器中。

<img src="/images/webstorm-debug4.png"/>

在底部，你将会看到调试控制台也被激活（不要忘了点击 **continue** 按钮，否则你的应用将会一直挂
在那里）。

<img src="/images/webstorm-debug5.png"/>

# 在 Visual Studio 2017 中调试

在 Visual Studio 2017 中调试 JavaScript/TypeScript 项目是很简单的，你只需要在
**解决方案资源管理器** 中将入口文件`dist/index.js`（或者 `src/index.js`） 
**设置为启动项** 即可，就像这样：

<img src="/images/vs-debug.png"/>

接着你就能够直接点击顶部菜单栏中的调试按钮进行调试了。


<img src="/images/vs-debug-button.png"/>

Visual Studio 表现得和 VS Code 与 WebStorm 有些不同，在调试时，一个新的控制台窗口将会弹出。
除此之外，其他的所有操作都几乎一样，你也可以直接在 JavaScript/TypeScript 源代码中设置断点。

<img src="/images/vs-debug2.png"/>

在底部面板中，你可以查看调用栈、断点，等等。

<img src="/images/vs-debug3.png"/>

# 在 Chrome 浏览器中调试

如果你正在使用其他编辑器，并且没有合适的调试工具，那么你可以直接在 Chrome 浏览器中进行调试（
如果下面的过程在你的浏览器上不起作用，请将你的 Chrome 升级到最新版本，或者找到相应的方式）。

### 安装必需的依赖

想要允许 Chrome 调试一个 TypeScript 项目，你必须首先在项目本地安装两个模块：
[ts-node](https://github.com/TypeStrong/ts-node) 和
[typescript](https://github.com/Microsoft/TypeScript)。

```sh
npm i --save-dev ts-node typescript
```

然而，如果你并不大算使用 TypeScript 编程，则这个步骤可以忽略。

### 使用调试命令启动应用

请使用这个命令来启动你的应用，注意 `--inspect` 一定要处在正确的位置。

```sh
node --inspect --require ts-node/register src
```

如果你没有使用 TypeScript 编程，则直接这么做：

```sh
node --inspect src
```

### 打开 Chrome 调试器

在 Chrome 的输入栏中，输入命令 `about:inspect`，它会自动引导你打开监视器窗口，并自动搜寻
活跃中且可以进行调试的 NodeJS 应用。

<img src="/images/chrome-search-bar.png"/>

点击下面显示的 **inspect** 按钮，一个新的开发者工具窗口会自动地呈现出来，在上面你可以进行所有
和调试有关的工作。

<img src="/images/active-node-app.png"/>

*另一种更简单的打开调试器的方式是，首先在浏览器中打开你项目的网页，然后按下 `F12` 来打开*
*开发者工具，一个 NodeJS 的图标*
*<img src="/images/chrome-node-debug.png" style="display:inline"/> 将会自动地显示*
*出来，你可以直接点击它来打开相应的调试器窗口。*

首先确保你已经在 **Sources** 选项卡下，然后在 **Filesystem** 分类下点击 
**+ Add folder to workspace** 按钮选择并打开你的项目，你将会收到一个安全警告，只要点击 
**确定** 即可。

<img src="/images/inspect-panel.png"/>

在你导入目录之后，我猜你已经之道接下来该怎么做了。Chrome 开发者工具就是一个迷你版本的 IDE，你
可以在这儿编辑代码、设置断点、查看日志、暂停和继续程序，等等。

<img src="/images/inspect-panel2.png"/>

<img src="/images/inspect-panel3.png"/>

由于这是一个使用 TypeScript 的实例，因此如果你在 Chrome 中编辑了你的代码，记住，你需要打开
另一个终端窗口来编译源代码，并且可能需要重新运行应用，如果你尚未启用热重载功能的话（SFN 中一个
实验性的特性）。

# 在 Sublime Text 中调试

关于如何在 Sublime Text 中调试 JavaScript 应用的知识，请查阅插件
[Web Inspector](https://packagecontrol.io/packages/Web%20Inspector)。

关于调试 TypeScript 应用的知识，请查阅微软官方的插件
[TypeScript-Sublime-Plugin](https://github.com/Microsoft/TypeScript-Sublime-Plugin).

# 在 Firefox 中调试

关于如何在 Firefox 中调试 NodeJS 应用的知识，请在 MDN 上
[查阅文档](https://developer.mozilla.org/en-US/docs/Tools/Debugger)，或者尝试用
[谷歌](https://google.com) 查找相关的文章。我找到的这篇文章可能有所帮助：
[Introducing debugger.html](https://hacks.mozilla.org/2016/09/introducing-debugger-html/).