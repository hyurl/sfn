<!-- title: Debug In IDE; order: 7.1 -->

# Debug With Visual Studio Code

In the developing phase, using an IDE to debug the application is recommended, 
SFN provides a simple scheme to debug in **Visual Studio Code**. If you've just 
installed the framework, and you have a `.vscode` folder under your project 
directory, the framework will automatically generate a debug configuration file 
`launch.json` for you. But if such a filename already exists, or `.vscode` isn't
there, then no generation operation will be performed. You may create this file 
yourself, or just click the button **Debug** >> **Open Configurations**, the 
editor will automatically generate the template file used for debugging. All you
have to do is just configure it just like the following, and it's ready to debug.

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "type": "node",
            "request": "launch",
            "protocol": "auto",
            "name": "Launch the Server",
            "program": "${workspaceFolder}/dist/index",
            "autoAttachChildProcesses": true
        }
    ]
}
```

## Snapshot

### Debug Panel

<img src="/images/debug-panel.png" alt="Debug Panel" title="Debug Panel" width="300" />

### Debug Controls

<img src="/images/debug-controls.png" alt="Debug Controls" title="Debug Controls" width="360" />

Visual Studio Code debugger has built-in support for TypeScript, so you can 
directly set break points in the source files, all these things, is just like 
debugging a pure JavaScript project.

Be aware if you're not coding in TypeScript, please remember to change 
`${workspaceFolder}/dist/index` to `${workspaceFolder}/src/index`.

More about Visual Studio Code debugging details, please check
[Debugging in Visual Studio Code](https://code.visualstudio.com/docs/editor/debugging)。

## Don't Use The Restart Button

It is worth mentioned that when you want to restart your application when 
debugging, don't click the **Restart**
<img src="/images/debug-controls-restart.png" width="24" /> on the Debug 
Controls. As I tested, although it will restart the process, but it won't reload
program files, which is not what we want. If you don't have to restart the 
master process, you just need to recompile (or edit) the source code, the 
service process will be automatically reloaded when detects file changes. If you
need to reboot the master process, you have to restart the debugger manually.