import { FSWatcher } from "alar";
import { PluginProxy } from '../tools/Plugin';
import { APP_PATH } from '../../init';

declare global {
    namespace app {
        namespace plugins {
            const name: string;
            const path: string;
            function resolve(path: string): string;
            function watch(): FSWatcher;
        }
    }
}

global.app.plugins = new PluginProxy("app.plugins", APP_PATH + "/plugins");