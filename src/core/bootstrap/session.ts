import * as Session from "express-session";
import { crc32 } from "crc";
import { config } from "./ConfigLoader";

type SessionHanlder = (req: any, res: any, next: Function) => void;

export var session = <SessionHanlder>Session(config.session);

export function getHash(session: object): number {
    return crc32(JSON.stringify(session, (k, v) => {
        return k !== "cookie" ? v : undefined
    }));
}