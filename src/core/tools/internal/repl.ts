import * as os from "os";
import * as vm from "vm";
import * as net from "net";
import * as repl from "repl";
import * as path from "path";
import * as fs from "fs-extra";
import * as readline from "readline";
import { processTopLevelAwait } from "node-repl-await";
import isSocketResetError = require('is-socket-reset-error');

function isRecoverableError(error: Error) {
    if (error.name === 'SyntaxError') {
        return /^(Unexpected end of input|Unexpected token)/.test(error.message);
    }
    return false;
}

function getSockPath(name: string, withPipe = false) {
    let hostname = app.config.server.hostname;
    let { port } = app.config.server.http;
    Array.isArray(hostname) && (hostname = hostname[0]);
    let appName = hostname + "-" + port;
    let path = `${os.tmpdir()}/.sfn/${appName}/${name}`;

    if (!withPipe || os.platform() !== "win32") {
        return path;
    } else {
        return "\\\\.\\pipe\\" + path;
    }
}

export async function serve(name: string) {
    let sockPath = getSockPath(name);

    await fs.ensureDir(path.dirname(sockPath));

    if (await fs.pathExists(sockPath)) {
        await fs.unlink(sockPath);
    }

    return net.createServer(socket => {
        let replServer = repl.start({
            input: socket,
            output: socket,
            useColors: true,
            useGlobal: true,
            async eval(code, context, filename, callback) {
                code = processTopLevelAwait(code) || code;

                try {
                    callback(null, await vm.runInNewContext(code, context, {
                        filename
                    }));
                } catch (err) {
                    if (isRecoverableError(err)) {
                        callback(new repl.Recoverable(err), void 0);
                    } else {
                        callback(err, void 0);
                    }
                }
            }
        });

        replServer.on("exit", () => {
            socket.destroy();
        });

        socket.on("close", () => {
            replServer.close();
        }).on("error", err => {
            if (!isSocketResetError(err)) {
                console.log(err);
            }
        });
    }).listen(getSockPath(name, true));
}

export async function connect(name: string) {
    let socket: net.Socket = await new Promise((resolve, reject) => {
        let socket = net.createConnection(getSockPath(name, true))
            .once("error", reject)
            .once("connect", () => {
                resolve(socket);
            });
    });
    let input = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    input.on("line", line => {
        socket.write(line + "\n");
    });

    socket.pipe(process.stdout);

    socket.on("close", (hadError) => {
        process.exit(hadError ? 1 : 0);
    });

    return socket;
}