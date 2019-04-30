import * as util from "util";
import { green } from './color';

export function isOwnMethod(obj: any, method: string): boolean {
    return typeof obj[method] === "function" &&
        (<Object>obj.constructor.prototype).hasOwnProperty(method);
}


export function serveTip(type: string, serverId: string, url: string) {
    return green`${type} server [${serverId}](${url}) started.`;
}

export function baseUrl(): string {
    let { server: { hostname, http: { port, type } } } = app.config,
        host = hostname + (port == 80 || port == 443 ? "" : ":" + port);

    /** The base URL of the server (calculated according to the config). */
    return (type == "http2" ? "https" : type) + "://" + host;
}

export function inspectAs<T>(target: T, data: any): T {
    target[util.inspect.custom] = () => data;
    return target;
}