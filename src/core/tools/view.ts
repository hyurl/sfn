import { ModuleLoader, ModuleProxy } from "alar";
import { SRC_PATH } from '../../init';
import get = require('lodash/get');

declare global {
    namespace app {
        const views: {
            [path: string]: ModuleProxy | Function;
            register(loader: ViewLoader): void;
        }
    }
}

export interface View {
    render(data: { [name: string]: any }): string;
}

export interface ViewLoader extends ModuleLoader {
    load(path: string): View;
}

export function loadView(type: string, filename: string) {
    let loader = <ModuleProxy>app.views[type];

    if (!loader) return null;

    return get(loader, loader.resolve(filename));
}

global["app"]["views"] = {
    register(loader: ViewLoader) {
        var proxy = new ModuleProxy("views", SRC_PATH + "/views");

        proxy.setLoader(loader);
        app.views[loader.extesion.slice(1)] = proxy;
    }
};