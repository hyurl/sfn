# Service Framework for NodeJS

**An easy and elegant distributed service framework for Node.js**

* [Node.js v10.0+](http://nodejs.org/)
* [ES 2018](https://babeljs.io/learn-es2015/)
* [TypeScript](https://typescriptlang.org "SFN always ships with the latest features, make sure your TypeScript compiler is the newest version")
* [MIT License](https://opensource.org/licenses/MIT "SFN is licensed under the MIT license, you're free to use")

For documentation, please go to the [Wiki](https://github.com/hyurl/sfn/wiki).

## Easy and Elegant

SFN provides a set of friendly and elegant APIs, you can use them to build an expressive
application very quickly, just focus on your own logic and design, and the framework
will automatically handle everything that remains for you.

## Distributed Design

SFN supports auto-scaling and service discovery, it allows you developing in one machine,
and separate services whenever and wherever. The system will auto-redirect traffics,
and distributively deploy without any modification.

## Hot Reloading Modules

SFN provides a module solution that allows you, after modifying a source file,
immediately hot-reload the module and functions without rebooting the process. And when
deploying, restarting remote service will not break the application.

***

### Run Test

SFN currently doesn't provide any unit test of the framework (but dependency 
modules do), the only way to test it is simply cloning the repository from
GitHub to your computer, install all the dependencies and run the built-in 
documentation website.

```sh
git clone https://github.com/hyurl/sfn
mkdir ./node_modules
ln -s ./sfn ./node_modules/sfn # some modules require sfn in node_modules
cd sfn
npm install
tsc
node dist
```
