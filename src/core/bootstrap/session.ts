import * as Session from "express-session";
import { config } from "../../index";

type SessionHanlder = (req: any, res: any, next: Function) => void;

export var session = <SessionHanlder>Session(config.session);