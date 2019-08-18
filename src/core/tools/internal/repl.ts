import * as os from "os";
import { serve as _serve, connect as _connect } from "power-repl";

function getSockPath(name: string) {
    let hostname = app.config.server.hostname;
    let { port } = app.config.server.http;
    Array.isArray(hostname) && (hostname = hostname[0]);

    return `${os.tmpdir()}/.sfn/${hostname}-${port}/${name}.sock`;
}

export function serve(name: string) {
    return _serve(getSockPath(name));
}

export function connect(name: string, noStdout = false) {
    return _connect({
        path: getSockPath(name),
        noStdout
    });
}