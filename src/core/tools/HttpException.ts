import { STATUS_CODES } from "http";
import { isDevMode } from "../../init";
import define from "@hyurl/utils/define";

export class HttpException extends Error {
    constructor(readonly code: number, message?: string) {
        super(message || STATUS_CODES[code] || "Unknown error");
        Error.captureStackTrace(this, this.constructor);
    }

    get name() {
        return this.constructor.name;
    }

    toString() {
        return this.name + ": " + this.code + " " + this.message;
    }

    static from(err: any): HttpException {
        if (err instanceof this) {
            return err;
        } else if (err instanceof HttpException) {
            return Object.setPrototypeOf(err, this.prototype);
        } else if (err instanceof Error) {
            return new this(500, isDevMode ? err.message : null);
        } else {
            return new this(500, String(err));
        }
    }
}

define(global, "StatusException", HttpException);

/** @deprecated Use `HttpException` instead. */
export const StatusException = HttpException;
export type StatusException = HttpException;
