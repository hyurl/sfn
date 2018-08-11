# Service Framework for Node.js

**A Service Framework for Node.js.**

For documentation, please visit [sfnjs.com](https://sfnjs.com).

## How To Use?

### Initiate Your Project

Create a directory to store files of your project, then use the command

```sh
npm init
```

to initiate your project, assume you have some knowledge of **npm** and have 
**Node.js** installed.

### Install TypeScript

**SFN** is written in **TypeScript**, which your own code should as well, 
but it's not necessary, we will talk about that later.

```sh
npm i -g typescript
```

If you're not familiar with TypeScript, you may need to learn it first, but 
if you're not going to using it, this procedure is optional.

### Turn On TypeScript Support

To turn on TypeScript support of your project, just add a new file named 
`tsconfig.json` in your project directory, it's contents should be like these:

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
        "sourceMap": true,
        "importHelpers": false,
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

After all files downloaded, the **SFN** framework will perform initiating 
procedure, creating needed files and directories for you automatically.

### Start Demo Server

**SFN** provides a demo, so you can now start server and see what will happen.
firstly, compile the source code with the command: `tsc` (only with 
TypeScript), then type the command:

```sh
node dist/index
```

Or `node src/index` in JavaScript.

And the server should be started in no seconds.

You can add the command `start` to the `scripts` field of your `package.json` 
file, so that whenever you want to start the server, just run `npm start`.

### Write Your First Controller

You can see that there is a folder named **src/controllers** generated in your 
project, it's where you're going put you controller files in.

You may open and edit the demo files in it, but here I'm going to show you how
to create a new one (with TypeScript).

Create a file in **src/controllers**, named `Demo.ts`:

```typescript
import { HttpController, route } from "sfn";

export default class extends HttpController {
    @route.get("/demo")
    index() {
        return "Hello, World!";
    }
}
```

Now restart the server, you will see `Hello, World!` when you visit 
`http://localhost/demo`.

## Why Using **SFN**?

**SFN** provides a very easy-to-use and efficient API, you can just write few 
lines of code, and the frame work will handle other stuffs for you. One of the
principles in **SFN** is: **If the framework can do the work, then the user** 
**shouldn't do it.**

For such a goal, **SFN** provides many features, etc. **shared session**, 
**simple file uploading**, **error handling**, **multi-processing**, etc. You 
don't need to worry how the framework does those jobs, just focus on your own 
design.

## License

**SFN** is licensed under **MIT**, you're free to use.