<!-- title: IDE 调试; order: 7.1 -->

# 使用 Visual Studio Code 调试应用

开发阶段，使用 IDE 调试应用是被建议的。SFN 提供了一个简单的适用于 **Visual Studio Code**
进行调试的方案，如果你是刚开始安装 SFN 框架，并且你的工作目录下有一个 `.vscode` 文件夹，
框架会自动生成用于调试的配置文件 `launch.json`。如果文件已经存在，或者 `.vscode` 
文件夹不存在，那么将不会自动生成。你可以自己创建这个文件，或者直接点解编辑器菜单按钮中的
**【调试】** >> **【打开配置】**，编辑器将会自动生成用于配置调试的模板文件，你只需要将
其配置成类似下面这样，就可以使用调试了：

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "node",
            "request": "launch",
            "protocol": "auto",
            "name": "启动服务器",
            "program": "${workspaceFolder}/dist/index",
            "autoAttachChildProcesses": true
        }
    ]
}
```

## 截图

### 调试面板

<img src="/images/debug-panel.png" alt="Debug Panel" title="Debug Panel" width="300" />

### 调试控制条

<img src="/images/debug-controls.png" alt="Debug Controls" title="Debug Controls" width="360" />

Visual Studio Code 调试是直接支持 TypeScript 的，因此你可以直接在源文件上设置断点什么
的，这一切，和调试纯 JavaScript 项目没什么大的区别。

注意如果你没有使用 TypeScript 来进行开发，请记得把 
`${workspaceFolder}/dist/index` 修改为 `${workspaceFolder}/src/index`。

更多关于 Visual Studio Code 调试应用的详情，请查阅
[Debugging in Visual Studio Code](https://code.visualstudio.com/docs/editor/debugging)。

## 不要使用 IDE 的进程重启按钮

另外需要特别注意的是，当你想要在调试中重启应用的时候，不要点击点击调试工具栏上的
**【重启】**<img src="/images/debug-controls-restart.png" width="24" />按钮，
经过测试，那个按钮虽然会重启进程，但却不会使进程重新加载程序文件，这并不是我们想要的。
如果你没必要重启主进程，只需要重新编译（或编辑）代码，服务进程会在监听到文件改变时自动
重启。如果你需要重启主进程，则需要手动重启调试。