import { STATUS_CODES } from "http";

export class HttpError extends Error {

    constructor(readonly code: number, message?: string) {
        super(message || STATUS_CODES[code]);
        Error.captureStackTrace(this, this.constructor);
    }

    get name() {
        return this.constructor.name;
    }

    toString() {
        return this.name + ": " + this.code + " " + this.message;
    }
}