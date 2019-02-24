import * as alar from "alar";
import { SRC_PATH } from '../../init';
import { Plugin } from '../tools/Plugin';

declare global {
    namespace app {
        namespace plugins {
            const name: string;
        }
    }
}

global["app"].plugins = new Plugin("app.plugins");
export const plugins = new alar.ModuleProxy("plugins", SRC_PATH + "/plugins");