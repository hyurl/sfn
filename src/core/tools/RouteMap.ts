import { HttpController } from "../controllers/HttpController";

export interface RouteMap {
    [route: string]: {
        Class: typeof HttpController;
        method: string;
    }
}

export const RouteMap: RouteMap = {};