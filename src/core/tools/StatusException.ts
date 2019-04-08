import { STATUS_CODES } from "http";
import { RpcChannel } from "alar";

export class StatusException extends Error {
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

RpcChannel.registerError(StatusException);

/** An alias of `StatusException`. */
export const HttpError = StatusException;

/** An alias of `StatusException`. */
export const SocketError = StatusException;