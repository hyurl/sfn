<!-- title: Debug In IDE; order: 7.1 -->

# Concept

During development phase, using an IDE to debug the application is recommended.
SFN supports many ways to debug, and the configuration is very easy to set.

# Debug In Visual Studio Code

### Setup Configuration

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
            "program": "${workspaceFolder}/dist/index"
        }
    ]
}
```

Visual Studio Code debugger has built-in support for TypeScript, so you can 
directly set breakpoints in the source files, all these things, is just like 
debugging a pure JavaScript project.

<img src="/images/vscode-debug.png" alt="Debug Panel" title="Debug Panel" width="auto" />

More about Visual Studio Code debugging details, please check
[Debugging in Visual Studio Code](https://code.visualstudio.com/docs/editor/debugging)。

# Debug In WebStorm

### Setup Configuration

It is also easy to configure debugger for SFN in WebStorm, which has build-in 
support for TypeScript as well. First open your project directory in a WebStorm 
window, click the button **Run** on the top menu, and select 
**Add/Edit Configuration** item, a configuration window will self-popup.

Click the plus sign **+** button at top-left, choose item **Node.js**, and you will be 
asked for inputting detail of the project, select the **Working directory**
and **JavaScript file** as shown below, click **OK**, and it's done.

<img src="/images/webstorm-debug.png"/>

### Auto-Compile TypeScript

You may also want to auto-compile your project if you're coding in TypeScript, 
just do the following steps:

<img src="/images/webstorm-debug-compile.png" style="display:inline-block;vertical-align:top"/>

<img src="/images/webstorm-debug-compile2.png" style="display:inline-block;vertical-align:top"/>

### Start Debugging The Application

Once setup, you can now click the **Debug** button at the top-right corner in 
the window:

<img src="/images/webstorm-debug2.png"/>

And you'll be seeing this console that says application successfully started in 
debug mode:

<img src="/images/webstorm-debug3.png"/>

### Set And Hit Breakpoints

You can set breakpoints in a source file, then open your browser visiting a link
that will definitely hit it, and you will be seeing the result similar to this 
in your editor:

<img src="/images/webstorm-debug4.png"/>

And on the bottom, you will see the debug console activated (don't forget to 
click the **continue** button so your program won't hang still):

<img src="/images/webstorm-debug5.png"/>

# Debug in Visual Studio 2017

Debugging JavaScript/TypeScript project in Visual Studio is easy, you just have 
to set the entry file `dist/index.js` as **Startup Item** in
**Solution Explorer**, just like this:

<img src="/images/vs-debug.png"/>

And you will be able to debug the application by clicking the debug button on 
the top menu:

<img src="/images/vs-debug-button.png"/>

Visual Studio debugger behave a little different than VS Code or WebStorm, when
debugging, a new console window will be open. Except that, other operations are 
almost the same, and you can set breakpoints directly in the TypeScript source 
code.

<img src="/images/vs-debug2.png"/>

In the bottom panel, you can watch call stack, breakpoints, etc.

<img src="/images/vs-debug3.png"/>