import * as vm from "vm";
import * as repl from "repl";
import { PassThrough } from "stream";
import { processTopLevelAwait } from "node-repl-await";

declare global {
    namespace app {
        namespace services {
            const repl: ModuleProxy<REPLService>;
        }
    }
}

async function asyncEval(code, context, filename, callback) {
    code = processTopLevelAwait(code) || code;

    try {
        let result = await vm.runInThisContext(code);

        app.services.repl.instance(app.services.local).write(null, result);
    } catch (err) {
        app.services.repl.instance(app.services.local).write(err, void 0);
    }

    callback(null, void 0);
}

export type REPLResult = {
    success: boolean,
    data: any,
    isRecoverableError?: boolean
};

export default class REPLService {
    protected stream = new PassThrough();
    protected replServer = repl.start({
        input: this.stream,
        output: this.stream,
        eval: asyncEval,
        prompt: "",
    });
    private handleOutput: (err: Error, data?: any) => void;

    run(code: string): Promise<REPLResult> {
        return new Promise((resolve, reject) => {
            this.handleOutput = (err, data) => {
                err ? reject(err) : resolve(data);
            };
            this.stream.write(code + "\n", "utf8", err => {
                err && reject(err);
            });
        });
    }

    async write(err: Error, data?: any) {
        this.handleOutput(err, data);
    }
}