import { STATUS_CODES } from "http";
import { RpcChannel } from "alar";
import { isDevMode } from "../../init";

export class StatusException extends Error {
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

    static from(err: any): StatusException {
        if (err instanceof this) {
            return err;
        } else if (err instanceof StatusException) {
            return Object.setPrototypeOf(err, this.prototype);
        } else if (err instanceof Error) {
            return new this(500, isDevMode ? err.message : null);
        } else {
            return new this(500, String(err));
        }
    }
}

RpcChannel.registerError(StatusException);