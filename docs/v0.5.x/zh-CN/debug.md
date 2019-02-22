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
**解决方案资源管理器** 中将入口文件`dist/index.js` **设置为启动项** 即可，就像这样：

<img src="/images/vs-debug.png"/>

接着你就能够直接点击顶部菜单栏中的调试按钮进行调试了。


<img src="/images/vs-debug-button.png"/>

Visual Studio 表现得和 VS Code 与 WebStorm 有些不同，在调试时，一个新的控制台窗口将会弹出。
除此之外，其他的所有操作都几乎一样，你也可以直接在 TypeScript 源代码中设置断点。

<img src="/images/vs-debug2.png"/>

在底部面板中，你可以查看调用栈、断点，等等。

<img src="/images/vs-debug3.png"/>