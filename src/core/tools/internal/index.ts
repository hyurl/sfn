import { green } from './color';

export function isOwnMethod(obj: any, method: string): boolean {
    return typeof obj[method] === "function" &&
        (<Object>obj.constructor.prototype).hasOwnProperty(method);
}


export function serveTip(type: string, serverId: string, url: string) {
    return green`${type} server [${serverId}](${url}) started.`;
}