<!-- title: Getting Start; order: 1 -->
### Initiate Your Project

Create a directory to store files of your project, then use the command

```sh
npm init
```

to initiate your project, assume you have some knowledge of 
[NPM](https://www.npmjs.com/) and have [NodeJS](https://nodejs.org) installed.

### Install TypeScript

**SFN** is written in [TypeScript](https://www.typescriptlang.org), which your
own code should be as well, but it's not necessary, we will talk about that 
later.

```sh
npm i -g typescript
```

If you're not familiar with TypeScript, you may need to learn it first, but 
if you're not going to use it, this procedure is optional.

### Turn On TypeScript Support

To turn on TypeScript support of your project, just add a new file named 
[tsconfig.json](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html)
in your project directory, it's contents should be like these

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

Just copy this example, and it will be fine for most cases. If `tsconfig.json`
is missing, the framework will run in pure JavaScript mode.

### Install Framework

After you have initiated your project, you can now install **SFN** by using 
this command:

```sh
npm i sfn
```

After all files downloaded, type the following command to initiate your project,
it will create needed files and directories for you automatically.

But before running this procedure, you have to setup the environment for NodeJS 
to run user-defined commands. See [Command Line](./command-line).

```sh
sfn init
```

### Start Demo Server

**SFN** provides a demo, so you can now start server and see what will happen.
firstly, compile the source code with the command: `tsc` (only with 
TypeScript), then type the command:

```sh
sfn start
```

And the server should be started in few seconds.