# Service Framework for NodeJS

**A Service Framework for NodeJS.**

For documentation, please visit [sfnjs.com](https://sfnjs.com).

## How To Use?

### Initiate Your Project

Create a directory to store files of your project, then use the command

```sh
npm init
```

to initiate your project, assume you have some knowledge of 
[NPM](https://www.npmjs.com/) and have [NodeJS](https://nodejs.org) installed.

### Install TypeScript Compiler And Runtime

**SFN** is written in [TypeScript](https://www.typescriptlang.org), which your
own code should be as well.

*The runtime [ts-node](https://github.com/TypeStrong/ts-node) is optional, only*
*needed if you want to run your program without compiling.*

```sh
npm i -g typescript
npm i -g ts-node
```

### Install PM2 (Optional)

Since version 0.3.x, SFN uses [PM2](https://pm2.io) as its application manager 
and load-balancer, so to better deploy your application, you'd also install PM2
and use it to start you application (however it is production environment 
requirement, not necessary during development).

```sh
npm i -g pm2
```

### Install Framework

After you have initiated your project, you can now install **SFN** by using 
this command:

```sh
npm i sfn
```

After all files downloaded, SFN will initiate your project, creating needed 
files and directories for you automatically.

### Start Demo Server

**SFN** provides a demo, so you can now start server and see what will happen.
firstly, compile the source code with the command: `tsc`, then type the command:

```sh
node dist
```

And the server should be started in few seconds.

If you have PM2 installed, you can use the following command to start the 
application, and auto-scale according to the CPU numbers.

```sh
pm2 start dist/index.js -i max
```

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

Additionally, SFN is written in TypeScript, the strong-typed language instead of 
pure JavaScript, it's way more safer than just using JavaScript for a strong and
featured web program.

## License

**SFN** is licensed under [MIT](./LICENSE), you're free to use.

## Run Test

SFN currently doesn't provide any unit tests of the framework (but dependency 
modules do), the only way to test it is simply clone the repository from GitHub 
to your computer, install all the dependencies and run the built-in 
documentation website.

```sh
git clone https://github.com/hyurl/sfn
mkdir ../node_modules
ln -s ./sfn ../node_modules/sfn # some modules require sfn in node_modules
cd sfn
npm i
node dist
```

And the doc server will started, note that the server port is `80` by default, 
if it's not available on your machine, simply modify it in `.env` file before 
running the application.