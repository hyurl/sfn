if (!process.stdout.isTTY) {
    // Force the console to output colorfully.
    process.env.FORCE_COLOR = 3;
}

const path = require("path");

// When running the program in REPL, there is no main module defined by default, 
// to keep the framework running expectedly, assign a default main module to the
// process object.
require.main || (require.main = process.mainModule = {
    id: "<repl>",
    require,
    exports: {},
    loaded: true,
    parent: undefined,
    children: [],
    paths: [],
    filename: __filename || path.resolve(process.cwd(), "<repl>")
});

// For NodeJS version before 10.0 to support asyncIterator
if (!Symbol.asyncIterator) {
    Symbol.asyncIterator = Symbol("Symbol.asyncIterator");
}