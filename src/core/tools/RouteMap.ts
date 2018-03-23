import { HttpController } from "../controllers/HttpController";
import { Request, Response } from "./interfaces";

export interface RouteMap {
    [route: string]: {
        Class: typeof HttpController;
        method: string;
    }
}

export const RouteMap: RouteMap = {};