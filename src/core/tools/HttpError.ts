import { STATUS_CODES } from "http";

export class HttpError extends Error {
    code: number;

    constructor(code: number, message?: string) {
        message = message || STATUS_CODES[code];
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        message = `${code} ${message}`;
        var stack = this.stack.substring(this.stack.indexOf("\n"));
        this.stack = `${this.name}: ${message}${stack}`;
    }

    toString(): string {
        let str: string = super.constructor.prototype.toString.call(this),
            i = str.indexOf(" ");
        return str.slice(0, i) + " " + this.code + str.slice(i);
    }
}