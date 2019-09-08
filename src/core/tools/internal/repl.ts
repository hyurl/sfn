import * as os from "os";
import { serve as _serve, connect as _connect } from "power-repl";

function getSockPath(id: string) {
    let { port } = app.config.server.http;
    let baseDir = os.platform() === "win32" ? os.tmpdir() : "/tmp";
    return `${baseDir}/sfn/${port}/${id}.sock`;
}

export function serve(id: string) {
    return _serve(getSockPath(id));
}

export function connect(id: string, noStdout = false) {
    return _connect({
        path: getSockPath(id),
        noStdout
    });
}