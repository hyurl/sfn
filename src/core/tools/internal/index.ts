import * as util from "util";
import { green } from './color';

const truePattern = /^\s*(true|yes|on)\s*$/i;
const falsePattern = /^\s*(false|no|off)\s*$/i;
const nullPattern = /^\s*(null|nil|none|void)\s*$/i;

export function isOwnMethod(obj: any, method: string): boolean {
    return typeof obj[method] === "function" &&
        (<Object>obj.constructor.prototype).hasOwnProperty(method);
}

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

export function isSubClassOf(target: Function, base: Function) {
    return target.prototype instanceof base;
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

/** Casts the value or its properties to the closest types. */
export function ensureType(value: any) {
    switch (typeof value) {
        case "string": {
            if (truePattern.test(value)) {
                return true;
            } else if (falsePattern.test(value)) {
                return false;
            } else if (nullPattern.test(value)) {
                return null;
            } else {
                let num = Number(value);

                if (!isNaN(num) && num <= Math.pow(2, 31) - 1) {
                    return num;
                } else {
                    return value;
                }
            }
        }

        case "object": {
            if (Array.isArray(value)) {
                let arr = [];

                for (let item of value) {
                    arr.push(ensureType(item));
                }

                return arr;
            } else {
                let obj = {};

                for (let key in value) {
                    if (value.hasOwnProperty(key)) {
                        obj[key] = ensureType(value[key]);
                    }
                }

                return obj;
            }
        }

        default:
            return value;
    }
}