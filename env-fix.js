// Force the console to output colorfully.
process.env.FORCE_COLOR = "10";

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