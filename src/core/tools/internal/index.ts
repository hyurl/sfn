import * as util from "util";
import { green } from './color';

export const EFFECT_METHODS: string[] = [
    "DELETE",
    "PATCH",
    "POST",
    "PUT"
];

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
