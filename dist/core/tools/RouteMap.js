"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const get = require("lodash/get");
class RouteMap {
    constructor() {
        this.locks = new Map();
        this.dataMap = new Map();
        this.methodMap = new Map();
    }
    keyof(data) {
        let { prefix, route, ctor } = data;
        let name = app.controllers.resolve(ctor.filename);
        let key = prefix + " " + route + " " + name;
        if (!this.dataMap.get(key)) {
            this.dataMap.set(key, data);
        }
        return key;
    }
    add(key, method) {
        let methods = this.methods(key);
        if (methods.includes(method)) {
            return false;
        }
        else {
            methods.push(method);
            this.methodMap.set(key, methods);
            return true;
        }
    }
    del(key, method) {
        let methods = this.methods(key);
        let index = methods.indexOf(method);
        if (index === -1) {
            return false;
        }
        else {
            methods.splice(index, 1);
            this.methodMap.set(key, methods);
            return true;
        }
    }
    get(key) {
        return this.dataMap.get(key);
    }
    resolve(key) {
        let data = this.get(key);
        let { ctor: { filename } } = data;
        let mod = null;
        if (filename) {
            mod = get(app, app.controllers.resolve(filename));
        }
        return mod;
    }
    lock(key) {
        if (!this.isLocked(key)) {
            this.locks.set(key, true);
            return true;
        }
        else {
            return false;
        }
    }
    isLocked(key) {
        return this.locks.get(key) === true;
    }
    methods(key) {
        return this.methodMap.get(key) || [];
    }
    values() {
        return this.dataMap.values();
    }
}
exports.RouteMap = RouteMap;
exports.routeMap = new RouteMap();
exports.eventMap = new RouteMap();
//# sourceMappingURL=RouteMap.js.map