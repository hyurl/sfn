import * as Session from "express-session";
import { config } from "./ConfigLoader";

type SessionHanlder = (req: any, res: any, next: Function) => void;

export var session = <SessionHanlder>Session(config.session);