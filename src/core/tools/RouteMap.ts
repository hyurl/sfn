import get = require('lodash/get');
import { ControllerContructor } from "../controllers/Controller";
import { HttpController } from '../controllers/HttpController';
import { WebSocketController } from '../controllers/WebSocketController';

export type RouteMapData<T> = {
    prefix: string,
    route: string,
    ctor: ControllerContructor<T>,
}

export class RouteMap<T> {
    private locks = new Map<string, boolean>();
    private dataMap = new Map<string, RouteMapData<T>>();
    private methodMap = new Map<string, string[]>();

    keyof(data: RouteMapData<T>) {
        let { prefix, route, ctor } = data;
        let name = app.controllers.resolve(ctor.filename);
        let key = prefix + " " + route + " " + name;

        if (!this.dataMap.get(key)) {
            this.dataMap.set(key, data);
        }

        return key;
    }

    add(key: string, method: string): boolean {
        let methods = this.methods(key);

        if (methods.includes(method)) {
            return false;
        } else {
            methods.push(method);
            this.methodMap.set(key, methods);
            return true;
        }
    }

    del(key: string, method: string): boolean {
        let methods = this.methods(key);
        let index = methods.indexOf(method);

        if (index === -1) {
            return false;
        } else {
            methods.splice(index, 1);
            this.methodMap.set(key, methods);
            return true;
        }
    }

    get(key: string) {
        return this.dataMap.get(key);
    }

    resolve(key: string): ModuleProxy<T> {
        let data = this.get(key);
        let { ctor: { filename } } = data;
        let mod = null;

        if (filename) {
            mod = get(app, app.controllers.resolve(filename));
        }

        return mod;
    }

    lock(key: string): boolean {
        if (!this.isLocked(key)) {
            this.locks.set(key, true);
            return true;
        } else {
            return false;
        }
    }

    isLocked(key: string) {
        return this.locks.get(key) === true;
    }

    methods(key: string) {
        return this.methodMap.get(key) || [];
    }

    values() {
        return this.dataMap.values();
    }
}

export const routeMap = new RouteMap<HttpController>();
export const eventMap = new RouteMap<WebSocketController>();