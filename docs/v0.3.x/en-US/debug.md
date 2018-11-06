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

Be aware if you're not coding in TypeScript, please remember to change 
`${workspaceFolder}/dist/index` to `${workspaceFolder}/src/index`.

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
to set the entry file `dist/index.js` (or `src/index.js`) as **Startup Item** in
**Solution Explorer**, just like this:

<img src="/images/vs-debug.png"/>

And you will be able to debug the application by clicking the debug button on 
the top menu:

<img src="/images/vs-debug-button.png"/>

Visual Studio debugger behave a little different than VS Code or WebStorm, when
debugging, a new console window will be open. Except that, other operations are 
almost the same, and you can set breakpoints directly in the 
JavaScript/TypeScript source code.

<img src="/images/vs-debug2.png"/>

In the bottom panel, you can watch call stack, breakpoints, etc.

<img src="/images/vs-debug3.png"/>

# Debug In Chrome

If you're programming with other editors and without proper debug tools, you can 
just debug the application in Chrome browser (If the following procedure 
doesn't work for you, please update your Chrome to the newest version, or find 
some way relevant).

### Install Required Dependencies

To allow Chrome debugging a TypeScript project, you must first have 
[ts-node](https://github.com/TypeStrong/ts-node) and 
[typescript](https://github.com/Microsoft/TypeScript) installed locally.

```sh
npm i --save-dev ts-node typescript
```

However, if you're not planning coding TypeScript, this procedure can be ignored.

### Start Application With Inspect Flag

Using this command to start your application, note that `--inspect` flag must be
presented at right position.

```sh
node --inspect --require ts-node/register src
```

If you're not coding TypeScript, just do this:

```sh
node --inspect src
```

### Open Chrome Debugger

At Chrome's search bar, input command `about:inspect`, it will direct you to the
inspect window and automatically search active NodeJS application that can be 
debugged.

<img src="/images/chrome-search-bar.png"/>

Click the **inspect** button as shown below, a new DevTools window will be 
displayed to you, where you can do all the debugging stuff on.

<img src="/images/active-node-app.png"/>

*(Another easier way to open Chrome debugger is first opening the webpage of*
*your project, then press `F12` to open DevTools panel, a NodeJS icon*
*<img src="/images/chrome-node-debug.png" style="display:inline"/> will*
*automatically display at top-left corner on the panel, which can directly open*
*the dedicated debugger.)*

First make sure you're under **Sources** tab, then click the button 
**+ Add folder to workspace** under **Filesystem** category to open your project,
a warning will be emitted to ask you for security, just click **YES**.

<img src="/images/inspect-panel.png"/>

After you've imported the directory, I'm guessing you've already known what to 
do next. The Chrome DevTools is a minimal IDE, you can edit your code here, set 
breakpoints, watch logs, pause and resume process, etc.

<img src="/images/inspect-panel2.png"/>

<img src="/images/inspect-panel3.png"/>

Since this is an example using TypeScript, so if you edited your code in Chrome,
remember you must open a new terminal to recompile the source code, and probably
re-run the application if you haven't enabled hot-reloading functionality （an 
experimental feature in SFN).

# Debug in Sublime Text

For how to debug a JavaScript application in Sublime Text, please check the 
plugin [Web Inspector](https://packagecontrol.io/packages/Web%20Inspector).

For debugging a TypeScript application, please check Microsoft official plugin 
[TypeScript-Sublime-Plugin](https://github.com/Microsoft/TypeScript-Sublime-Plugin).

# Debug In Firefox

For how to debug a NodeJS application in Firefox, please 
[check the documentation](https://developer.mozilla.org/en-US/docs/Tools/Debugger)
on MDN, or try searching relevant articles via [google](https://google.com). 
This article I found might help: 
[Introducing debugger.html](https://hacks.mozilla.org/2016/09/introducing-debugger-html/).