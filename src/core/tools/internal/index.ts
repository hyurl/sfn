import * as util from "util";
import { green } from './color';

export function serveTip(type: string, id: string, url: string) {
    return green`${type} server [${id}](${url}) started.`;
}

/** The base URL of the server (calculated according to the config). */
export function baseUrl(): string {
    let { server: { hostname, http: { port, type } } } = app.config,
        host = hostname + (port == 80 || port == 443 ? "" : ":" + port);

    return (type == "http2" ? "https" : type) + "://" + host;
}

export function inspectAs<T>(target: T, data: any): T {
    target[util.inspect.custom] = () => data;
    return target;
}

/**
 * Adds a property to the target object, if a function of value is provided, it
 * will be registered as a getter.
 */
export function define(target: any, prop: string, value: any) {
    let options: PropertyDescriptor = {
        enumerable: true,
        configurable: true,
    };

    if (typeof value === "function" &&
        !["valueOf", "toString", "toJSON"].includes(prop)) {
        options.get = value;
    } else {
        options.value = value;
        options.writable = false;
    }

    return Object.defineProperty(target, prop, options);
}

export function copyFuncProps(source: Function, target: Function) {
    define(target, "name", source.name);
    define(target, "length", source.length);
    define(target, "toString", source.toString.bind(source));
    return target;
}