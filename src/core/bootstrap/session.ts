import * as Session from "express-session";
import { config } from "../../init";

type SessionHanlder = (req: any, res: any, next: Function) => void;

export var session = <SessionHanlder>Session(config.session);