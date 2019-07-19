import * as alar from "alar";
import { APP_PATH } from "../../init";
import { Controller } from '../controllers/Controller';

declare global {
    namespace app {
        const controllers: alar.ModuleProxy & { [x: string]: ModuleProxy<Controller> };
    }
}

global.app.controllers = new alar.ModuleProxy("app.controllers", APP_PATH + "/controllers");