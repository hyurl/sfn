import * as repl from "repl";
import "../init";
import "../core/bootstrap/index";
import "../core/bootstrap/load-config";

function isRecoverableError(error) {
    if (error.name === 'SyntaxError') {
        return /^(Unexpected end of input)/.test(error.message);
    }
    return false;
}

(async () => {
    await app.rpc.connectAll();

    repl.start({
        async eval(code, context, filename, callback) {
            try {
                let result = await app.services.repl.instance("rpc://localhost:4001").run(code);

                callback(null, result);
            } catch (err) {
                if (isRecoverableError(err)) {
                    callback(new repl.Recoverable(err), void 0);
                } else {
                    console.log(err);
                }
            }
        }
    });
})();