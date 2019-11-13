if (!process.stdout.isTTY) {
    // Force the console to output colorfully.
    process.env.FORCE_COLOR = 3;
}

const path = require("path");

// When run the program in REPL, there is no mainModule defined by default, 
// to keep the framework running expectedly, assign a default mainModule to the
// process object.
process.mainModule = process.mainModule || {
    id: "<repl>",
    require,
    exports: {},
    loaded: true,
    parent: undefined,
    children: [],
    paths: [],
    filename: __filename || path.resolve(process.cwd(), "<repl>")
};

// For NodeJS version before 10.0 to support asyncIterator
if (!Symbol.asyncIterator) {
    Symbol.asyncIterator = Symbol("Symbol.asyncIterator");
}