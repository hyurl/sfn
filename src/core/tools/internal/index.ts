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

export function isSubClassOf(target: Function, base: Function) {
    return target.prototype instanceof base;
}

export function transRecordTypes(data: Record<string, string>) {
    let _data: Record<string, string | number | boolean> = {};
    let numbers = /^\s*[0-9]+\s*$/;

    for (let key in data) {
        let value = data[key];

        if (["true", "True", "TRUE"].includes(value)) {
            _data[key] = true;
        } else if (["false", "False", "FALSE"].includes(value)) {
            _data[key] = false;
        } else if (numbers.test(value)) {
            _data[key] = parseInt(value);
        } else {
            _data[key] = data[key];
        }
    }

    return _data;
}